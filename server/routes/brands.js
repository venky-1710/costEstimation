const express = require('express');
const { body, validationResult } = require('express-validator');
const Brand = require('../models/Brand');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/brands
// @desc    Create new brand
// @access  Private (Trader, Admin)
router.post('/', auth, authorize('trader', 'admin'), [
  body('name').notEmpty().withMessage('Brand name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if brand already exists for this trader
    const existingBrand = await Brand.findOne({ 
      name: { $regex: new RegExp('^' + name.trim() + '$', 'i') },
      traderId: req.user._id 
    });

    if (existingBrand) {
      return res.status(400).json({ 
        message: 'A brand with this name already exists in your account',
        errors: [{ param: 'name', msg: 'Brand name already exists' }]
      });
    }

    const brand = new Brand({
      name: name.trim(),
      description: description ? description.trim() : '',
      traderId: req.user._id
    });

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/brands
// @desc    Get all brands for a trader
// @access  Private (Trader, Admin)
router.get('/', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // If user is trader, only show their brands
    // Admin can see all brands
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }
    // Admin sees all brands (no traderId filter)

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const brands = await Brand.find(query)
      .populate('traderId', 'name traderProfile.businessName')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Brand.countDocuments(query);

    res.json({
      brands,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/brands/:id
// @desc    Get brand by ID
// @access  Private (Trader, Admin)
router.get('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('traderId', 'name traderProfile.businessName');

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Check if trader is accessing their own brand
    if (req.user.role === 'trader' && brand.traderId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this brand' });
    }

    res.json(brand);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/brands/:id
// @desc    Update brand
// @access  Private (Trader, Admin)
router.put('/:id', auth, authorize('trader', 'admin'), [
  body('name').optional().notEmpty().withMessage('Brand name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Check if trader is updating their own brand
    if (req.user.role === 'trader' && brand.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this brand' });
    }

    const { name, description, isActive } = req.body;

    // Check if new name conflicts with existing brand for this trader
    if (name && name.trim() !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: { $regex: new RegExp('^' + name.trim() + '$', 'i') },
        traderId: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingBrand) {
        return res.status(400).json({ 
          message: 'A brand with this name already exists in your account',
          errors: [{ param: 'name', msg: 'Brand name already exists' }]
        });
      }
    }

    // Update fields
    if (name) brand.name = name.trim();
    if (description !== undefined) brand.description = description.trim();
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();
    res.json(brand);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/brands/:id
// @desc    Delete brand
// @access  Private (Trader, Admin)
router.delete('/:id', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Check if trader is deleting their own brand
    if (req.user.role === 'trader' && brand.traderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this brand' });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
