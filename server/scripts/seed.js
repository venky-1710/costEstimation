const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Brand = require('../models/Brand');
const Item = require('../models/Item');
const Estimate = require('../models/Estimate');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Brand.deleteMany({});
    await Item.deleteMany({});
    await Estimate.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@costestimation.com',
      password: 'admin123',
      phone: '+91-9999999999',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create trader user
    const traderUser = new User({
      name: 'John Trader',
      email: 'trader@costestimation.com',
      password: 'trader123',
      phone: '+91-9999999998',
      role: 'trader',
      traderProfile: {
        businessName: 'John Construction Materials',
        businessAddress: '123 Business Street, City, State - 123456',
        gstNumber: '27AAAAA0000A1Z5',
        licenseNumber: 'LIC12345'
      }
    });
    await traderUser.save();
    console.log('Created trader user');

    // Create customer user
    const customerUser = new User({
      name: 'Jane Customer',
      email: 'customer@costestimation.com',
      password: 'customer123',
      phone: '+91-9999999997',
      role: 'customer'
    });
    await customerUser.save();
    console.log('Created customer user');

    // Create sample brands for trader
    const brands = [
      { name: 'Ambuja Cement', description: 'Premium quality cement', traderId: traderUser._id },
      { name: 'Ultratech', description: 'Leading cement brand', traderId: traderUser._id },
      { name: 'JSW Steel', description: 'Quality steel products', traderId: traderUser._id },
      { name: 'Birla TMT', description: 'TMT bars and steel', traderId: traderUser._id }
    ];

    const createdBrands = await Brand.insertMany(brands);
    console.log('Created sample brands');

    // Create sample customers for trader
    const customers = [
      {
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@example.com',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        tags: ['Engineer', 'Regular'],
        traderId: traderUser._id
      },
      {
        name: 'Priya Construction',
        phone: '+91-9876543211',
        email: 'priya@construction.com',
        address: {
          street: '456 Builder Lane',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        gstNumber: '07AAAAA0000A1Z6',
        tags: ['Contractor', 'VIP'],
        traderId: traderUser._id
      },
      {
        name: 'Amit Sharma',
        phone: '+91-9876543212',
        email: 'amit@example.com',
        address: {
          street: '789 Home Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        tags: ['Individual', 'New'],
        traderId: traderUser._id
      }
    ];

    const createdCustomers = await Customer.insertMany(customers);
    console.log('Created sample customers');

    // Create sample items for trader
    const items = [
      {
        name: 'OPC Cement 50kg',
        category: 'Cement',
        brand: createdBrands[0]._id,
        uom: 'bag',
        currentRate: 350,
        description: 'Ordinary Portland Cement 50kg bag',
        traderId: traderUser._id
      },
      {
        name: 'TMT Bar 12mm',
        category: 'Steel',
        brand: createdBrands[2]._id,
        uom: 'kg',
        currentRate: 65,
        description: '12mm TMT reinforcement bar',
        traderId: traderUser._id
      },
      {
        name: 'Sand (River Sand)',
        category: 'Aggregates',
        brand: createdBrands[0]._id,
        uom: 'cft',
        currentRate: 45,
        description: 'Natural river sand for construction',
        traderId: traderUser._id
      },
      {
        name: 'Concrete Blocks',
        category: 'Blocks',
        brand: createdBrands[1]._id,
        uom: 'piece',
        currentRate: 25,
        description: 'Hollow concrete blocks',
        traderId: traderUser._id
      }
    ];

    const createdItems = await Item.insertMany(items);
    console.log('Created sample items');

    console.log('\n=== Sample Data Created Successfully ===');
    console.log('Admin Login: admin@costestimation.com / admin123');
    console.log('Trader Login: trader@costestimation.com / trader123');
    console.log('Customer Login: customer@costestimation.com / customer123');
    console.log('\nYou can now start the application and login with these credentials.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedData();
