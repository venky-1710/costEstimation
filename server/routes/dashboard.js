const express = require('express');
const Estimate = require('../models/Estimate');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const Brand = require('../models/Brand');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Trader, Admin)
router.get('/stats', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let query = {};
    
    // If user is trader, only show their data
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    // Get current month date range
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Total estimates
    const totalEstimates = await Estimate.countDocuments(query);

    // This month estimates
    const thisMonthEstimates = await Estimate.countDocuments({
      ...query,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Converted estimates
    const convertedEstimates = await Estimate.countDocuments({
      ...query,
      isConverted: true
    });

    // Pending estimates (sent but not viewed or converted)
    const pendingEstimates = await Estimate.countDocuments({
      ...query,
      status: { $in: ['sent'] },
      isConverted: false
    });

    // Total customers
    const totalCustomers = await Customer.countDocuments(
      req.user.role === 'trader' ? { traderId: req.user._id } : {}
    );

    // Total items
    const totalItems = await Item.countDocuments(
      req.user.role === 'trader' ? { traderId: req.user._id } : {}
    );

    // Total brands
    const totalBrands = await Brand.countDocuments(
      req.user.role === 'trader' ? { traderId: req.user._id } : {}
    );

    // Total value of estimates this month
    const thisMonthValue = await Estimate.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$total' }
        }
      }
    ]);

    // Conversion rate
    const conversionRate = totalEstimates > 0 ? 
      ((convertedEstimates / totalEstimates) * 100).toFixed(2) : 0;

    res.json({
      totalEstimates,
      thisMonthEstimates,
      convertedEstimates,
      pendingEstimates,
      totalCustomers,
      totalItems,
      totalBrands,
      thisMonthValue: thisMonthValue[0]?.totalValue || 0,
      conversionRate: parseFloat(conversionRate)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-estimates
// @desc    Get recent estimates
// @access  Private (Trader, Admin)
router.get('/recent-estimates', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let query = {};
    
    // If user is trader, only show their estimates
    if (req.user.role === 'trader') {
      query.traderId = req.user._id;
    }

    const recentEstimates = await Estimate.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('estimateNumber customer total status createdAt');

    res.json(recentEstimates);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-customers
// @desc    Get top customers by estimate count
// @access  Private (Trader, Admin)
router.get('/top-customers', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let matchQuery = {};
    
    // If user is trader, only show their estimates
    if (req.user.role === 'trader') {
      matchQuery.traderId = req.user._id;
    }

    const topCustomers = await Estimate.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$customer',
          estimateCount: { $sum: 1 },
          totalValue: { $sum: '$total' },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$isConverted', true] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          name: '$customer.name',
          phone: '$customer.phone',
          estimateCount: 1,
          totalValue: 1,
          convertedCount: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedCount', '$estimateCount'] },
              100
            ]
          }
        }
      },
      { $sort: { estimateCount: -1 } },
      { $limit: 5 }
    ]);

    res.json(topCustomers);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/monthly-stats
// @desc    Get monthly statistics for charts
// @access  Private (Trader, Admin)
router.get('/monthly-stats', auth, authorize('trader', 'admin'), async (req, res) => {
  try {
    let matchQuery = {};
    
    // If user is trader, only show their estimates
    if (req.user.role === 'trader') {
      matchQuery.traderId = req.user._id;
    }

    // Get last 6 months data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Estimate.aggregate([
      {
        $match: {
          ...matchQuery,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$total' },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$isConverted', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json(monthlyStats);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/admin-stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/admin-stats', auth, authorize('admin'), async (req, res) => {
  try {
    // Total users by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total estimates across all traders
    const totalEstimates = await Estimate.countDocuments();

    // Total customers across all traders
    const totalCustomers = await Customer.countDocuments();

    // Total items across all traders
    const totalItems = await Item.countDocuments();

    // Total brands across all traders
    const totalBrands = await Brand.countDocuments();

    // Most active traders
    const activeTraders = await Estimate.aggregate([
      {
        $group: {
          _id: '$traderId',
          estimateCount: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'trader'
        }
      },
      { $unwind: '$trader' },
      {
        $project: {
          name: '$trader.name',
          businessName: '$trader.traderProfile.businessName',
          estimateCount: 1,
          totalValue: 1
        }
      },
      { $sort: { estimateCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      userStats,
      totalEstimates,
      totalCustomers,
      totalItems,
      totalBrands,
      activeTraders
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
