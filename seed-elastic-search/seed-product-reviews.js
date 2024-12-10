require('dotenv').config();
const mysql = require('mysql2/promise');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const { Client } = require('@elastic/elasticsearch');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Elasticsearch client
const elasticClient = new Client({
    node: 'https://1a9b3798720947d19fb8939e78cf2473.us-west-1.aws.found.io:443',
    auth: {
        apiKey: process.env.ELASTIC_API_KEY
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'PasswOrd1!',
    database: 'smarthomes',
    socketPath: '/tmp/mysql.sock',
    debug: true
};

// Utility function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch product IDs from MySQL
async function fetchProductIds() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL successfully');
        
        const query = `
            SELECT 
                ProductID,
                ProductModelName
            FROM Products
        `;
        
        const [products] = await connection.execute(query);
        console.log(`Retrieved ${products.length} products from database`);
        
        // Convert to a map for easier lookup
        const productMap = new Map(products.map(p => [p.ProductModelName, p.ProductID]));
        return productMap;
        
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed');
        }
    }
}

// Function to read reviews from JSON file
async function readReviews() {
    try {
        const reviewsData = await fs.readFile('product_reviews.json', 'utf8');
        return JSON.parse(reviewsData);
    } catch (error) {
        console.error('Error reading reviews file:', error);
        throw error;
    }
}

// Function to get embeddings from OpenAI with retry logic
async function getEmbedding(text, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Retry ${i + 1} for embedding generation...`);
            await delay(1000 * (i + 1)); 
        }
    }
}

// Function to create Elasticsearch index for reviews
async function createReviewsIndex() {
    try {
        const indexName = 'product_reviews_embeddings';
        const indexExists = await elasticClient.indices.exists({ index: indexName });
        
        if (indexExists) {
            console.log('Deleting existing reviews index...');
            await elasticClient.indices.delete({ index: indexName });
            console.log('Successfully deleted existing index');
        }

        console.log('Creating new reviews index...');
        await elasticClient.indices.create({
            index: indexName,
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                },
                mappings: {
                    properties: {
                        productId: { type: 'integer' },
                        reviewInfo: {
                            properties: {
                                productModelName: { type: 'keyword' },
                                productCategory: { type: 'keyword' },
                                productPrice: { type: 'float' },
                                reviewRating: { type: 'integer' },
                                reviewDate: { type: 'date' },
                                reviewText: { 
                                    type: 'text',
                                    analyzer: 'standard'
                                }
                            }
                        },
                        embedding: {
                            type: 'dense_vector',
                            dims: 1536,
                            index: true,
                            similarity: 'cosine'
                        }
                    }
                }
            }
        });
        console.log('Reviews index created successfully');
    } catch (error) {
        console.error('Error managing reviews index:', error);
        throw error;
    }
}

// Function to generate and store review embeddings
async function processReviews(reviews, productMap) {
    const batchSize = 5; // Process in batches to avoid rate limits
    const operations = [];

    for (let i = 0; i < reviews.length; i += batchSize) {
        const batch = reviews.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(reviews.length/batchSize)}`);
        
        await Promise.all(batch.map(async (review) => {
            const productId = productMap.get(review.productModelName);
            if (!productId) {
                console.warn(`No product ID found for: ${review.productModelName}`);
                return;
            }

            // Combine review information for embedding
            const reviewText = `${review.productModelName} ${review.productCategory} ${review.productPrice} ${review.reviewRating} ${review.reviewText}`;
            
            try {
                const embedding = await getEmbedding(reviewText);
                operations.push(
                    { index: { _index: 'product_reviews_embeddings' } },
                    {
                        productId: productId,
                        reviewInfo: {
                            productModelName: review.productModelName,
                            productCategory: review.productCategory,
                            productPrice: review.productPrice,
                            reviewRating: review.reviewRating,
                            reviewDate: review.reviewDate,
                            reviewText: review.reviewText
                        },
                        embedding: embedding
                    }
                );
                console.log(`Generated embedding for review of: ${review.productModelName}`);
            } catch (error) {
                console.error(`Error processing review for ${review.productModelName}:`, error);
            }
        }));
        
        // Small delay between batches
        await delay(1000);
    }

    // Store in Elasticsearch
    if (operations.length > 0) {
        try {
            const bulkResponse = await elasticClient.bulk({
                refresh: true,
                operations
            });

            if (bulkResponse.errors) {
                const erroredDocuments = [];
                bulkResponse.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: operations[i * 2],
                            document: operations[i * 2 + 1]
                        });
                    }
                });
                console.error('Bulk operation completed with errors:', erroredDocuments);
            } else {
                console.log('Bulk operation completed successfully');
            }

            const count = await elasticClient.count({ index: 'product_reviews_embeddings' });
            console.log(`Total reviews in index: ${count.count}`);
        } catch (error) {
            console.error('Error storing review embeddings:', error);
            throw error;
        }
    }
}

// Function to test review search
async function testReviewSearch(searchText) {
    try {
        const searchEmbedding = await getEmbedding(searchText);
        
        const result = await elasticClient.search({
            index: 'product_reviews_embeddings',
            body: {
                query: {
                    script_score: {
                        query: { match_all: {} },
                        script: {
                            source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                            params: { query_vector: searchEmbedding }
                        }
                    }
                },
                size: 5
            }
        });

        console.log('Review search results:', JSON.stringify(result.hits.hits, null, 2));
    } catch (error) {
        console.error('Error performing review search:', error);
    }
}

// Main execution function
async function main() {
    try {
        // Test Elasticsearch connection
        const info = await elasticClient.info();
        console.log('Successfully connected to Elastic Cloud');

        // Create reviews index
        await createReviewsIndex();

        // Fetch product IDs
        console.log('Fetching product IDs from MySQL...');
        const productMap = await fetchProductIds();

        // Read reviews
        console.log('Reading reviews from file...');
        const reviews = await readReviews();
        console.log(`Found ${reviews.length} reviews`);

        // Process and store reviews
        console.log('Processing reviews and generating embeddings...');
        await processReviews(reviews, productMap);

        // Test search
        console.log('Testing review search functionality...');
        await testReviewSearch('positive reviews about video quality');

        console.log('Review processing completed successfully');
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the script
main();