const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').isIn(['admin', 'trader', 'customer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role, traderProfile, tags, referredBy } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role,
      traderProfile: role === 'trader' ? traderProfile : undefined,
      tags,
      referredBy
    });

    await user.save();

    // Check if user needs approval
    if (role === 'trader' || role === 'admin') {
      return res.status(201).json({
        message: 'Registration successful! Your account is pending approval. You will be notified once approved.',
        requiresApproval: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus
        }
      });
    }

    // For customers (though this route shouldn't be used for customers anymore)
    // Generate JWT token
    const payload = {
      userId: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        traderProfile: user.traderProfile,
        tags: user.tags
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check approval status for traders and admins
    if ((user.role === 'trader' || user.role === 'admin') && user.approvalStatus !== 'approved') {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin approval.' });
      } else if (user.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account has been rejected.', 
          rejectionReason: user.rejectionReason 
        });
      }
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      userId: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        traderProfile: user.traderProfile,
        tags: user.tags
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, traderProfile, tags } = req.body;

    // Check if email or phone already exists (excluding current user)
    if (email || phone) {
      const query = {
        _id: { $ne: req.user._id },
        $or: []
      };
      
      if (email) query.$or.push({ email });
      if (phone) query.$or.push({ phone });
      
      if (query.$or.length > 0) {
        const existingUser = await User.findOne(query);
        if (existingUser) {
          return res.status(400).json({ 
            message: 'User already exists with this email or phone' 
          });
        }
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (tags) updateData.tags = tags;
    
    // Update trader profile if user is a trader
    if (req.user.role === 'trader' && traderProfile) {
      updateData.traderProfile = {
        ...req.user.traderProfile,
        ...traderProfile
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Validate current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/tags
// @desc    Update user tags
// @access  Private
router.put('/tags', auth, [
  body('tags').isArray().withMessage('Tags must be an array'),
  body('tags.*').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Each tag must be a non-empty string with max 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tags } = req.body;

    // Remove duplicates and empty strings
    const uniqueTags = [...new Set(tags.filter(tag => tag && tag.trim()))];

    // Limit to maximum 10 tags
    if (uniqueTags.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 tags allowed' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { tags: uniqueTags },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ tags: user.tags, message: 'Tags updated successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-customer
// @desc    Register customer with profile
// @access  Public
router.post('/register-customer', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      password, 
      phone, 
      address,
      gstNumber,
      companyName,
      customerType,
      tags 
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Create customer profile
    const customerProfile = {
      address: address || {},
      gstNumber: gstNumber || '',
      companyName: companyName || '',
      customerType: customerType || 'individual'
    };

    // Create new customer user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'customer',
      customerProfile,
      tags: tags || []
    });

    await user.save();

    // Generate JWT token
    const payload = {
      userId: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customerProfile: user.customerProfile
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/pending-approvals
// @desc    Get all pending approval requests (admin only)
// @access  Private (Admin only)
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const pendingUsers = await User.find({ 
      approvalStatus: 'pending',
      role: { $in: ['trader', 'admin'] }
    }).select('-password').sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/approve-user/:id
// @desc    Approve user registration (admin only)
// @access  Private (Admin only)
router.put('/approve-user/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    user.approvalStatus = 'approved';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({ message: 'User approved successfully', user: user.name });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/reject-user/:id
// @desc    Reject user registration (admin only)
// @access  Private (Admin only)
router.put('/reject-user/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { rejectionReason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    user.approvalStatus = 'rejected';
    user.rejectedAt = new Date();
    user.rejectionReason = rejectionReason || 'No reason provided';
    await user.save();

    res.json({ message: 'User rejected successfully', user: user.name });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
