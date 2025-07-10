const express = require('express');
const { body, validationResult } = require('express-validator');
const Estimate = require('../models/Estimate');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Item = require('../models/Item');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/estimates
// @desc    Create new estimate
// @access  Private (Trader, Admin)
router.post('/', auth, authorize('trader', 'admin'), [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('validTill').isISO8601().withMessage('Valid till date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer,
      items,
      discount = 0,
      discountType = 'percentage',
      loadingCharges = 0,
      validTill,
      notes
    } = req.body;

    // Verify customer exists (check both Customer and User models)
    let customerDoc = await Customer.findById(customer);
    let isRegisteredCustomer = false;
    
    if (!customerDoc) {
      // Check if it's a registered customer (User with customer role)
      const userDoc = await User.findById(customer);
      if (userDoc && userDoc.role === 'customer') {
        customerDoc = userDoc;
        isRegisteredCustomer = true;
      } else {
        return res.status(404).json({ message: 'Customer not found' });
      }
    }

    // For traditional customers, check trader authorization
    if (!isRegisteredCustomer && req.user.role === 'trader' && 
        customerDoc.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this customer' });
    }

    // Process items and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const estimateItem of items) {
      const item = await Item.findById(estimateItem.item);
      if (!item) {
        return res.status(404).json({ message: `Item not found: ${estimateItem.item}` });
      }

      if (req.user.role === 'trader' && item.traderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this item' });
      }

      const total = estimateItem.quantity * estimateItem.rate;
      subtotal += total;

      processedItems.push({
        item: estimateItem.item,
        quantity: estimateItem.quantity,
        rate: estimateItem.rate,
        total
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const total = subtotal - discountAmount + loadingCharges;

    // Generate estimate number if not automatically set
    let estimateNumber;
    try {
      const count = await Estimate.countDocuments({ traderId: req.user._id });
      const year = new Date().getFullYear();
      estimateNumber = `EST-${year}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating estimate number:', error);
      const timestamp = Date.now().toString().slice(-6);
      estimateNumber = `EST-${new Date().getFullYear()}-${timestamp}`;
    }

    const estimate = new Estimate({
      estimateNumber,
      customer,
      traderId: req.user._id,
      items: processedItems,
      subtotal,
      discount,
      discountType,
      loadingCharges,
      total,
      validTill,
      notes
    });

    console.log('Creating estimate for trader:', req.user._id);
    console.log('Estimate before save:', estimate.toObject());

    await estimate.save();
    
    console.log('Estimate after save:', estimate.toObject());

    await estimate.populate([
      { path: 'customer', select: 'name phone email address gstNumber tags' },
      { path: 'items.item', select: 'name uom', populate: { path: 'brand', select: 'name' } }
    ]);

    res.status(201).json(estimate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/estimates
// @desc    Get all estimates for a trader
// @access  Private (Trader, Admin)
// @route   GET /api/estimates
// @desc    Get all estimates
// @access  Private (Trader, Admin, Customer - only their own)
router.get('/', auth, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      customer, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    } else if (req.user.role === 'customer') {
      // Customers can only see their own estimates
      query.customer = req.user._id;
    }
    // Admins can see all estimates (no additional filter needed)

    if (search) {
      query.estimateNumber = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (customer && req.user.role !== 'customer') {
      // Only non-customers can filter by customer
      query.customer = customer;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const estimates = await Estimate.find(query)
      .populate('customer', 'name phone email address gstNumber tags')
      .populate('traderId', 'name traderProfile.businessName')
      .populate('items.item', 'name uom')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Estimate.countDocuments(query);

    res.json({
      estimates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/estimates/my-estimates
// @desc    Get estimates for logged-in customer
// @access  Private (Customer)
router.get('/my-estimates', auth, authorize('customer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {
      $or: [
        { customer: req.user._id }, // For registered customers
        // For traditional customers, we'll need to find Customer records linked to this user
      ]
    };

    // Check if this user has any traditional customer records
    const traditionalCustomer = await Customer.findOne({ userId: req.user._id });
    if (traditionalCustomer) {
      query.$or.push({ customer: traditionalCustomer._id });
    }

    if (status) {
      query.status = status;
    }

    const estimates = await Estimate.find(query)
      .populate('traderId', 'name traderProfile.businessName email phone')
      .populate('items.item', 'name uom description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Estimate.countDocuments(query);

    res.json({
      estimates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/estimates/:id
// @desc    Get estimate by ID
// @access  Private (Trader, Admin, Customer)
router.get('/:id', auth, async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id)
      .populate('customer', 'name phone email address gstNumber tags')
      .populate('traderId', 'name email phone traderProfile')
      .populate('items.item', 'name uom description specifications')
      .populate('items.item.brand', 'name');

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    // Check authorization
    if (req.user.role === 'trader' && estimate.traderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this estimate' });
    }

    if (req.user.role === 'customer' && estimate.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this estimate' });
    }

    // Update viewed status if customer is viewing
    if (req.user.role === 'customer' && estimate.status === 'sent') {
      estimate.status = 'viewed';
      estimate.viewedAt = new Date();
      await estimate.save();
    }

    res.json(estimate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/estimates/:id
// @desc    Update estimate
// @access  Private (Trader, Admin)
router.put('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    // Check if trader is updating their own estimate
    if (req.user.role === 'trader' && estimate.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this estimate' });
    }

    const {
      items,
      discount,
      discountType,
      loadingCharges,
      validTill,
      notes,
      status,
      invoiceNumber,
      isConverted
    } = req.body;

    // If items are updated, recalculate totals
    if (items) {
      let subtotal = 0;
      const processedItems = [];

      for (const estimateItem of items) {
        const item = await Item.findById(estimateItem.item);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${estimateItem.item}` });
        }

        const total = estimateItem.quantity * estimateItem.rate;
        subtotal += total;

        processedItems.push({
          item: estimateItem.item,
          quantity: estimateItem.quantity,
          rate: estimateItem.rate,
          total
        });
      }

      estimate.items = processedItems;
      estimate.subtotal = subtotal;

      // Recalculate total
      let discountAmount = 0;
      const discountValue = discount !== undefined ? discount : estimate.discount;
      const discountTypeValue = discountType || estimate.discountType;

      if (discountTypeValue === 'percentage') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }

      const loadingChargesValue = loadingCharges !== undefined ? loadingCharges : estimate.loadingCharges;
      estimate.total = subtotal - discountAmount + loadingChargesValue;
    }

    // Update other fields
    if (discount !== undefined) estimate.discount = discount;
    if (discountType) estimate.discountType = discountType;
    if (loadingCharges !== undefined) estimate.loadingCharges = loadingCharges;
    if (validTill) estimate.validTill = validTill;
    if (notes !== undefined) estimate.notes = notes;
    if (status) estimate.status = status;
    if (invoiceNumber !== undefined) estimate.invoiceNumber = invoiceNumber;
    if (isConverted !== undefined) estimate.isConverted = isConverted;

    await estimate.save();
    await estimate.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.item', select: 'name uom', populate: { path: 'brand', select: 'name' } }
    ]);

    res.json(estimate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/estimates/:id
// @desc    Delete estimate
// @access  Private (Trader, Admin)
router.delete('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    // Check if trader is deleting their own estimate
    if (req.user.role === 'trader' && estimate.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this estimate' });
    }

    await Estimate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estimate deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/estimates/customer/:customerId
// @desc    Get estimates for a specific customer
// @access  Private (Trader, Admin)
router.get('/customer/:customerId', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const { dateFrom, dateTo, limit = 5 } = req.query;
    
    let query = { customer: req.params.customerId };
    
    // If user is trader, only show their estimates
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const estimates = await Estimate.find(query)
      .populate('customer', 'name phone email')
      .populate('items.item', 'name uom')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(estimates);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/estimates/search/item/:itemId
// @desc    Search estimates containing a specific item
// @access  Private (Trader, Admin)
router.get('/search/item/:itemId', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let query = { 'items.item': req.params.itemId };
    
    // If user is trader, only show their estimates
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    const estimates = await Estimate.find(query)
      .populate('customer', 'name phone email')
      .populate('items.item', 'name uom')
      .sort({ createdAt: -1 });

    res.json(estimates);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/estimates/:id/send
// @desc    Mark estimate as sent and update sent via
// @access  Private (Trader, Admin)
router.put('/:id/send', auth, authorize('trader', 'admin'), [
  body('sentVia').isArray().withMessage('Sent via must be an array')
], async (req, res) => {
  try {
    const { sentVia } = req.body;
    
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    // Check if trader is updating their own estimate
    if (req.user.role === 'trader' && estimate.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this estimate' });
    }

    estimate.status = 'sent';
    estimate.sentVia = sentVia;
    
    await estimate.save();
    res.json(estimate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
