const mongoose = require('mongoose');

async function establishConnection() {
    const connectionString = process.env.DATABASE_URL;
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
}

module.exports = establishConnection;
