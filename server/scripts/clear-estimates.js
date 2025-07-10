require('dotenv').config();
const mongoose = require('mongoose');
const Estimate = require('../models/Estimate');

async function clearEstimates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all estimates
    const result = await Estimate.deleteMany({});
    console.log(`Cleared ${result.deletedCount} estimates from database`);

    console.log('✅ Database cleared of estimate data');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing estimates:', error);
    process.exit(1);
  }
}

clearEstimates();
