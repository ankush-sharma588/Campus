const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error('MONGODB_URL is not configured. Add it to the Render backend environment.');
  }

  const conn = await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
