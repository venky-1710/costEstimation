require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');

async function clearBrands() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all brands
    const result = await Brand.deleteMany({});
    console.log(`Cleared ${result.deletedCount} brands from database`);

    console.log('✅ Database cleared of brand data');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing brands:', error);
    process.exit(1);
  }
}

clearBrands();
