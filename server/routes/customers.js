const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Trader, Admin)
router.post('/', auth, authorize('trader', 'admin'), [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      phone,
      email,
      address,
      gstNumber,
      tags,
      referredBy,
      referredByType,
      notes
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ 
      phone, 
      traderId: req.user._id 
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      gstNumber,
      tags,
      referredBy,
      referredByType,
      traderId: req.user._id,
      notes
    });

    await customer.save();
    await customer.populate('referredBy', 'name email');

    res.status(201).json(customer);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers
// @desc    Get all customers for a trader
// @access  Private (Trader, Admin)
router.get('/', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const { search, tag, page = 1, limit = 10, forEstimate = false } = req.query;
    
    let query = {};
    
    // If user is trader, only show their customers
    // Admin can see all customers
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }
    // Admin sees all customers (no traderId filter)

    // Only show active customers
    query.isActive = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    let customers;
    
    if (forEstimate === 'true') {
      // For estimate creation - return simplified data optimized for dropdowns
      customers = await Customer.find(query)
        .select('name phone email address gstNumber tags')
        .sort({ name: 1 }) // Sort by name for better UX
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      // For full customer management - return complete data
      customers = await Customer.find(query)
        .populate('referredBy', 'name email')
        .populate('traderId', 'name traderProfile.businessName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/for-estimate
// @desc    Get customers formatted for estimate creation (includes registered customers)
// @access  Private (Trader, Admin)
router.get('/for-estimate', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const { search, limit = 1000 } = req.query;
    
    let customerQuery = { isActive: true };
    let userQuery = { role: 'customer', isActive: true };
    
    // If user is trader, only show their customers
    if (req.user.role === 'trader') {
      customerQuery.traderId = req.user._id;
    }

    if (search) {
      customerQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
      
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get traditional customers (created by traders/admins)
    const traditionalCustomers = await Customer.find(customerQuery)
      .select('name phone email address gstNumber tags userId')
      .sort({ name: 1 })
      .limit(parseInt(limit / 2)); // Reserve half for registered customers

    // Get registered customers (users with customer role)
    const registeredCustomers = await User.find(userQuery)
      .select('name phone email customerProfile tags')
      .sort({ name: 1 })
      .limit(parseInt(limit / 2));

    // Format traditional customers
    const formattedTraditionalCustomers = traditionalCustomers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address ? {
        street: customer.address.street || '',
        city: customer.address.city || '',
        state: customer.address.state || '',
        pincode: customer.address.pincode || ''
      } : { street: '', city: '', state: '', pincode: '' },
      gstNumber: customer.gstNumber || '',
      tags: customer.tags || [],
      displayName: `${customer.name} (${customer.phone})${customer.email ? ` - ${customer.email}` : ''}`,
      fullAddress: customer.address ? 
        [customer.address.street, customer.address.city, customer.address.state, customer.address.pincode]
          .filter(Boolean).join(', ') : '',
      isRegistered: !!customer.userId,
      customerType: 'traditional'
    }));

    // Format registered customers
    const formattedRegisteredCustomers = registeredCustomers.map(user => ({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      address: user.customerProfile?.address ? {
        street: user.customerProfile.address.street || '',
        city: user.customerProfile.address.city || '',
        state: user.customerProfile.address.state || '',
        pincode: user.customerProfile.address.pincode || ''
      } : { street: '', city: '', state: '', pincode: '' },
      gstNumber: user.customerProfile?.gstNumber || '',
      tags: user.tags || [],
      displayName: `${user.name} (${user.phone})${user.email ? ` - ${user.email}` : ''} [Registered]`,
      fullAddress: user.customerProfile?.address ? 
        [user.customerProfile.address.street, user.customerProfile.address.city, 
         user.customerProfile.address.state, user.customerProfile.address.pincode]
          .filter(Boolean).join(', ') : '',
      isRegistered: true,
      customerType: 'registered',
      companyName: user.customerProfile?.companyName || ''
    }));

    // Combine and sort all customers
    const allCustomers = [...formattedTraditionalCustomers, ...formattedRegisteredCustomers]
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      customers: allCustomers,
      total: allCustomers.length
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private (Trader, Admin)
router.get('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('referredBy', 'name email')
      .populate('traderId', 'name traderProfile.businessName');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if trader is accessing their own customer
    if (req.user.role === 'trader' && customer.traderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this customer' });
    }

    res.json(customer);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private (Trader, Admin)
router.put('/:id', auth, authorize('trader', 'admin'), [
  body('name').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if trader is updating their own customer
    if (req.user.role === 'trader' && customer.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    const {
      name,
      phone,
      email,
      address,
      gstNumber,
      tags,
      referredBy,
      referredByType,
      notes,
      isActive
    } = req.body;

    // Update fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (address) customer.address = address;
    if (gstNumber !== undefined) customer.gstNumber = gstNumber;
    if (tags) customer.tags = tags;
    if (referredBy) customer.referredBy = referredBy;
    if (referredByType) customer.referredByType = referredByType;
    if (notes !== undefined) customer.notes = notes;
    if (isActive !== undefined) customer.isActive = isActive;

    await customer.save();
    await customer.populate('referredBy', 'name email');

    res.json(customer);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Trader, Admin)
router.delete('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if trader is deleting their own customer
    if (req.user.role === 'trader' && customer.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this customer' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/search/phone/:phone
// @desc    Search customer by phone number
// @access  Private (Trader, Admin)
router.get('/search/phone/:phone', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let query = { phone: req.params.phone };
    
    // If user is trader, only search their customers
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    const customer = await Customer.findOne(query)
      .populate('referredBy', 'name email')
      .populate('traderId', 'name traderProfile.businessName');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
