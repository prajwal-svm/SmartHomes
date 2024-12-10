require('dotenv').config();
const mysql = require('mysql2/promise');
const { OpenAI } = require('openai/index.mjs');
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

// Function to fetch products from MySQL
async function fetchProducts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL successfully');

        const query = `
            SELECT 
                ProductID,
                ProductModelName,
                ProductPrice,
                ProductCategory,
                ProductDescription
            FROM Products
        `;

        const [products] = await connection.execute(query);
        console.log(`Retrieved ${products.length} products from database`);

        // Log first product as a sample
        if (products.length > 0) {
            console.log('Sample product:', JSON.stringify(products[0], null, 2));
        }

        return products;
    } catch (error) {
        console.error('Error fetching products:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('MySQL connection closed');
        }
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
            await delay(1000 * (i + 1)); // Exponential backoff
        }
    }
}

// Function to generate and save embeddings
async function generateAndSaveEmbeddings(products) {
    const embeddings = [];
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(products.length / batchSize)}`);

        await Promise.all(batch.map(async (product) => {
            // Combine product information into a single text
            const productText = `${product.ProductModelName} ${product.ProductPrice} ${product.ProductCategory} ${product.ProductDescription}`;

            try {
                const embedding = await getEmbedding(productText);
                embeddings.push({
                    productId: product.ProductID,
                    productInfo: {
                        name: product.ProductModelName,
                        price: product.ProductPrice,
                        category: product.ProductCategory,
                        description: product.ProductDescription,
                    },
                    embedding: embedding
                });
                console.log(`Generated embedding for product: ${product.ProductModelName}`);
            } catch (error) {
                console.error(`Error generating embedding for product ${product.ProductModelName}:`, error);
            }
        }));

        // Small delay between batches
        await delay(1000);
    }

    // Save embeddings to file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `product_embeddings_${timestamp}.json`;
    await fs.writeFile(filename, JSON.stringify(embeddings, null, 2));
    console.log(`Embeddings saved to ${filename}`);

    return embeddings;
}

// Function to create Elasticsearch index
async function createEmbeddingsIndex() {
    try {
        const indexName = 'product_embeddings';
        const indexExists = await elasticClient.indices.exists({ index: indexName });

        if (indexExists) {
            console.log('Index already exists, skipping creation');
            return;
        }

        await elasticClient.indices.create({
            index: indexName,
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1,
                    'index.mapping.total_fields.limit': 2000,
                    'index.max_result_window': 10000
                },
                mappings: {
                    properties: {
                        productId: { type: 'integer' },
                        productInfo: {
                            properties: {
                                name: {
                                    type: 'text',
                                    fields: {
                                        keyword: {
                                            type: 'keyword',
                                            ignore_above: 256
                                        }
                                    }
                                },
                                price: { type: 'float' },
                                category: { type: 'keyword' },
                                description: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                brand: { type: 'keyword' },
                                inStock: { type: 'boolean' },
                                stockQuantity: { type: 'integer' }
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
        console.log('Elasticsearch index created successfully');
    } catch (error) {
        console.error('Error creating index:', error);
        throw error;
    }
}

// Function to store embeddings in Elasticsearch
async function storeEmbeddingsInElasticsearch(embeddings) {
    try {
        const operations = embeddings.flatMap(doc => [
            { index: { _index: 'product_embeddings' } },
            {
                productId: doc.productId,
                productInfo: doc.productInfo,
                embedding: doc.embedding
            }
        ]);

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

        // Get count of documents in index
        const count = await elasticClient.count({ index: 'product_embeddings' });
        console.log(`Total documents in index: ${count.count}`);

    } catch (error) {
        console.error('Error storing embeddings in Elasticsearch:', error);
        throw error;
    }
}

// Function to test search functionality
async function testSearch(searchText) {
    try {
        // First get embedding for search text
        const searchEmbedding = await getEmbedding(searchText);

        // Perform vector search
        const result = await elasticClient.search({
            index: 'product_embeddings',
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

        console.log('Search results:', JSON.stringify(result.hits.hits, null, 2));
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

// Main execution function
async function main() {
    try {
        // Test Elasticsearch connection
        const info = await elasticClient.info();
        console.log('Successfully connected to Elastic Cloud');
        console.log('Cluster info:', info);

        // Create index
        await createEmbeddingsIndex();

        // Fetch products
        console.log('Fetching products from MySQL...');
        const products = await fetchProducts();
        console.log(`Found ${products.length} products`);

        // Generate embeddings
        console.log('Generating embeddings...');
        const embeddings = await generateAndSaveEmbeddings(products);
        console.log(`Generated ${embeddings.length} embeddings`);

        // Store in Elasticsearch
        console.log('Storing embeddings in Elasticsearch...');
        await storeEmbeddingsInElasticsearch(embeddings);

        // Perform a test search
        console.log('Testing search functionality...');
        await testSearch('smart doorbell with camera');

        console.log('Process completed successfully');
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the script
main();