const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function clearSessions() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('admin'); // Ensure this is the correct database
        const collection = database.collection('sessions'); // Ensure this is the correct collection
        const result = await collection.deleteMany({});
        console.log(`Cleared ${result.deletedCount} session(s)`);
    } catch (error) {
        console.error('Error clearing sessions:', error);
    } finally {
        await client.close();
    }
}

clearSessions();
