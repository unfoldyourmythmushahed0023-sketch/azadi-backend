const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'azadi_platform';

let db;
let client;

async function connectDB() {
    if (db) return db;
    
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
}

function closeDB() {
    if (client) {
        client.close();
        console.log('🔒 MongoDB connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };
