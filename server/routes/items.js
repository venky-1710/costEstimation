const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/items
// @desc    Create new item
// @access  Private (Trader, Admin)
router.post('/', auth, authorize('trader', 'admin'), [
  body('name').notEmpty().withMessage('Item name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('uom').notEmpty().withMessage('Unit of measurement is required'),
  body('currentRate').isNumeric().withMessage('Current rate must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      category,
      brand,
      uom,
      currentRate,
      description,
      specifications
    } = req.body;

    const item = new Item({
      name,
      category,
      brand,
      uom,
      currentRate,
      description,
      specifications,
      traderId: req.user._id
    });

    await item.save();
    await item.populate('brand', 'name');

    res.status(201).json(item);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items
// @desc    Get all items for a trader
// @access  Private (Trader, Admin)
router.get('/', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const { search, category, brand, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // If user is trader, only show their items
    // Admin can see all items
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }
    // Admin sees all items (no traderId filter)

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (brand) {
      query.brand = brand;
    }

    const items = await Item.find(query)
      .populate('brand', 'name')
      .populate('traderId', 'name traderProfile.businessName')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/categories
// @desc    Get all unique categories
// @access  Private (Trader, Admin)
router.get('/categories', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let query = {};
    
    // If user is trader, only show their items
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    const categories = await Item.distinct('category', query);
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/:id
// @desc    Get item by ID
// @access  Private (Trader, Admin)
router.get('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('brand', 'name')
      .populate('traderId', 'name traderProfile.businessName');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if trader is accessing their own item
    if (req.user.role === 'trader' && item.traderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this item' });
    }

    res.json(item);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (Trader, Admin)
router.put('/:id', auth, authorize('trader', 'admin'), [
  body('name').optional().notEmpty().withMessage('Item name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('currentRate').optional().isNumeric().withMessage('Current rate must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if trader is updating their own item
    if (req.user.role === 'trader' && item.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const {
      name,
      category,
      brand,
      uom,
      currentRate,
      description,
      specifications,
      isActive
    } = req.body;

    // Update fields
    if (name) item.name = name;
    if (category) item.category = category;
    if (brand) item.brand = brand;
    if (uom) item.uom = uom;
    if (currentRate !== undefined) item.currentRate = currentRate;
    if (description !== undefined) item.description = description;
    if (specifications !== undefined) item.specifications = specifications;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();
    await item.populate('brand', 'name');

    res.json(item);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (Trader, Admin)
router.delete('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if trader is deleting their own item
    if (req.user.role === 'trader' && item.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
