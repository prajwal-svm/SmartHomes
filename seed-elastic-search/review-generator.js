require('dotenv').config();
const mysql = require('mysql2/promise');
const { OpenAI } = require('openai');
const fs = require('fs').promises;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'PasswOrd1!',
    database: 'smarthomes',
    socketPath: '/tmp/mysql.sock'
};

// Category-specific review criteria
const categoryPrompts = {
    'Smart Doorbells': {
        positive: 'convenient, secure, real-time, reliable, clear video',
        negative: 'glitchy, slow alerts, poor connection, privacy concerns'
    },
    'Smart Doorlocks': {
        positive: 'secure, convenient, remote access, easy install',
        negative: 'battery drain, app issues, unreliable, lock jams'
    },
    'Smart Speakers': {
        positive: 'responsive, good sound, versatile, user-friendly',
        negative: 'poor privacy, limited commands, connectivity issues'
    },
    'Smart Lighting': {
        positive: 'customizable, energy-efficient, remote control, mood-enhancing',
        negative: 'app problems, delay, connectivity issues, limited brightness'
    },
    'Smart Thermostats': {
        positive: 'energy-saving, easy to use, efficient, remote control',
        negative: 'difficult setup, temperature inaccuracy, app bugs, connectivity issues'
    }
};

// Function to fetch products from MySQL
async function fetchProducts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = `
            SELECT 
                ProductModelName,
                ProductDescription,
                ProductCategory,
                ProductPrice
            FROM Products
        `;
        const [products] = await connection.execute(query);
        return products;
    } finally {
        if (connection) await connection.end();
    }
}

// Function to generate a random date within the last 3 months
function generateRandomDate() {
    const end = new Date();
    const start = new Date(end.getTime() - (90 * 24 * 60 * 60 * 1000));
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
}

// Function to generate reviews using OpenAI
async function generateReviews(product, count) {
    const category = product.ProductCategory;
    const criteria = categoryPrompts[category] || {};
    
    const systemPrompt = `You are an expert at writing realistic product reviews for ${category}. 
Create a detailed, natural-sounding product review that incorporates some of these aspects:
For positive reviews (4-5 stars): ${criteria.positive}
For negative reviews (1-3 stars): ${criteria.negative}

The review should:
1. Be specific to the product and its features
2. Include personal experiences and use cases
3. Mention both pros and cons
4. Sound authentic and conversational
5. Be between 50-150 words`;

    const reviews = [];
    
    for (let i = 0; i < count; i++) {
        // Determine if this should be a positive or negative review
        // 70% chance of positive review (4-5 stars), 30% chance of negative (1-3 stars)
        const isPositive = Math.random() < 0.7;
        const rating = isPositive ? 
            Math.floor(Math.random() * 2) + 4 : 
            Math.floor(Math.random() * 3) + 1;  

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Write a ${rating}-star review for this ${category} product: ${product.ProductModelName} (Price: $${product.ProductPrice}). The review should reflect the rating given.` }
                ],
                temperature: 0.8,
                max_tokens: 200
            });

            const reviewText = completion.choices[0].message.content.trim();
            
            reviews.push({
                productModelName: product.ProductModelName,
                productCategory: product.ProductCategory,
                productPrice: product.ProductPrice,
                reviewRating: rating,
                reviewDate: generateRandomDate(),
                reviewText: reviewText
            });

            // Add a small delay between API calls to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error generating review for ${product.ProductModelName}:`, error);
        }
    }
    
    return reviews;
}

// Main execution function
async function main() {
    try {
        console.log('Fetching products from database...');
        const products = await fetchProducts();
        console.log(`Found ${products.length} products`);

        let allReviews = [];
        const reviewsPerProduct = 5;

        console.log('Generating reviews...');
        for (const product of products) {
            console.log(`Generating reviews for Product Name:${product.ProductModelName} and Description: ${product.ProductDescription}...`);
            const productReviews = await generateReviews(product, reviewsPerProduct);
            allReviews = allReviews.concat(productReviews);
            console.log(`Generated ${productReviews.length} reviews`);
        }

        // Save reviews to file
        await fs.writeFile(
            'product_reviews.json', 
            JSON.stringify(allReviews, null, 2)
        );
        
        console.log(`Successfully generated ${allReviews.length} reviews and saved to product_reviews_1.json`);
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the script
main();