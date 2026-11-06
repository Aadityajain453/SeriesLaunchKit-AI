const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
}

module.exports = connectDB;
