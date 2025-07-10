const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('referredBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/traders
// @desc    Get all traders
// @access  Private
router.get('/traders', auth, async (req, res) => {
  try {
    const traders = await User.find({ role: 'trader', isActive: true })
      .select('name email phone traderProfile')
      .sort({ name: 1 });

    res.json(traders);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('role').optional().isIn(['admin', 'trader', 'customer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    console.log('PUT /api/users/:id - Request body:', req.body);
    console.log('PUT /api/users/:id - User ID:', req.params.id);
    console.log('PUT /api/users/:id - Requesting user:', req.user.role, req.user._id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, traderProfile, tags, isActive, role } = req.body;

    // Check if user is updating their own profile or is admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      console.log('Authorization failed: Not admin and not updating own profile');
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user to update:', { id: user._id, name: user.name, role: user.role, isActive: user.isActive });

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (traderProfile && user.role === 'trader') user.traderProfile = traderProfile;
    if (tags) user.tags = tags;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;
    if (role && req.user.role === 'admin') user.role = role;

    console.log('Updated user fields:', { name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive });

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    console.log('User saved successfully:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('DELETE /api/users/:id - User ID:', req.params.id);
    console.log('DELETE /api/users/:id - Requesting user:', req.user.role, req.user._id);

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found for deletion:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Deleting user:', { id: user._id, name: user.name, role: user.role });

    await User.findByIdAndDelete(req.params.id);
    console.log('User deleted successfully');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
