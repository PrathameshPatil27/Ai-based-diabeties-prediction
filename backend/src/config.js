const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB');
};

module.exports = { connectToDatabase };



