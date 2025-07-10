require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Brand = require('../models/Brand');
const Item = require('../models/Item');
const Estimate = require('../models/Estimate');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    // Create trader user
    let traderUser = await User.findOne({ email: 'trader@example.com' });
    if (!traderUser) {
      traderUser = new User({
        name: 'Trader User',
        email: 'trader@example.com',
        password: 'trader123',
        phone: '8888888888',
        role: 'trader',
        status: 'active',
        traderProfile: {
          businessName: 'ABC Construction Materials',
          address: '123 Main Street, City',
          gstNumber: 'GST123456789',
          licenseNumber: 'LIC123456'
        }
      });
      await traderUser.save();
      console.log('Trader user created');
    }

    // Create brands
    const brands = [
      { name: 'Asian Paints', description: 'Premium paint brand', traderId: traderUser._id },
      { name: 'Ultratech', description: 'Leading cement manufacturer', traderId: traderUser._id },
      { name: 'JSW Steel', description: 'Steel products', traderId: traderUser._id }
    ];

    for (const brandData of brands) {
      const existingBrand = await Brand.findOne({ name: brandData.name });
      if (!existingBrand) {
        const brand = new Brand(brandData);
        await brand.save();
        console.log(`Brand ${brandData.name} created`);
      }
    }

    // Get created brands
    const asianPaints = await Brand.findOne({ name: 'Asian Paints' });
    const ultratech = await Brand.findOne({ name: 'Ultratech' });
    const jswSteel = await Brand.findOne({ name: 'JSW Steel' });

    // Create items
    const items = [
      {
        name: 'Exterior Paint',
        category: 'Paint',
        brand: asianPaints._id,
        uom: 'liter',
        currentRate: 450,
        description: 'Weather resistant exterior paint',
        traderId: traderUser._id
      },
      {
        name: 'Interior Paint',
        category: 'Paint',
        brand: asianPaints._id,
        uom: 'liter',
        currentRate: 350,
        description: 'Premium interior paint',
        traderId: traderUser._id
      },
      {
        name: 'OPC Cement',
        category: 'Cement',
        brand: ultratech._id,
        uom: 'bag',
        currentRate: 380,
        description: '50kg OPC cement bag',
        traderId: traderUser._id
      },
      {
        name: 'Steel Rod 12mm',
        category: 'Steel',
        brand: jswSteel._id,
        uom: 'kg',
        currentRate: 65,
        description: '12mm steel reinforcement rod',
        traderId: traderUser._id
      },
      {
        name: 'Steel Rod 16mm',
        category: 'Steel',
        brand: jswSteel._id,
        uom: 'kg',
        currentRate: 67,
        description: '16mm steel reinforcement rod',
        traderId: traderUser._id
      }
    ];

    for (const itemData of items) {
      const existingItem = await Item.findOne({ name: itemData.name, brand: itemData.brand });
      if (!existingItem) {
        const item = new Item(itemData);
        await item.save();
        console.log(`Item ${itemData.name} created`);
      }
    }

    // Create customers
    const customers = [
      {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        address: {
          street: '456 Oak Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        tags: ['regular', 'residential'],
        traderId: traderUser._id
      },
      {
        name: 'ABC Construction Ltd',
        phone: '9876543211',
        email: 'contact@abconstruction.com',
        address: {
          street: '789 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        tags: ['bulk', 'commercial'],
        gstNumber: 'GST987654321',
        traderId: traderUser._id
      },
      {
        name: 'Smith Builders',
        phone: '9876543212',
        email: 'info@smithbuilders.com',
        address: {
          street: '321 Builder Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003'
        },
        tags: ['contractor', 'regular'],
        traderId: traderUser._id
      }
    ];

    for (const customerData of customers) {
      const existingCustomer = await Customer.findOne({ phone: customerData.phone });
      if (!existingCustomer) {
        const customer = new Customer(customerData);
        await customer.save();
        console.log(`Customer ${customerData.name} created`);
      }
    }

    console.log('Data seeding completed successfully!');
    console.log('Login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Trader: trader@example.com / trader123');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding
seedData();
