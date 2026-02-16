const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/bulk-upload
// @desc    Bulk upload users (admin only)
// @access  Private (Admin)
router.post('/bulk-upload', adminAuth, async (req, res) => {
  try {
    const { users: usersData } = req.body;

    if (!Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of users' });
    }

    const results = { created: [], errors: [] };

    for (const userData of usersData) {
      try {
        const existing = await User.findOne({
          $or: [
            { staffId: userData.staffId },
            ...(userData.email ? [{ email: userData.email }] : []),
          ],
        });
        if (existing) {
          results.errors.push({
            data: { staffId: userData.staffId },
            error: 'User with this Staff ID or Email already exists',
          });
          continue;
        }
        const user = new User({
          staffId: userData.staffId,
          email: userData.email || undefined,
          password: userData.password || 'ChangeMe123',
          phoneNumber: userData.phoneNumber || 'N/A',
          department: userData.department || 'IT',
          position: userData.position || 'Staff',
          role: userData.role || 'user',
        });
        await user.save();
        results.created.push({
          _id: user._id,
          staffId: user.staffId,
          email: user.email,
          department: user.department,
          position: user.position,
        });
      } catch (error) {
        results.errors.push({
          data: { staffId: userData.staffId },
          error: error.message,
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get a single user
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'administrator' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions (admin only)
// @access  Private (Admin)
router.put('/:id/permissions', adminAuth, async (req, res) => {
  try {
    const { canMarkPaid, canMarkServed, canAccessSales } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (canMarkPaid !== undefined) user.permissions.canMarkPaid = canMarkPaid;
    if (canMarkServed !== undefined) user.permissions.canMarkServed = canMarkServed;
    if (canAccessSales !== undefined) user.permissions.canAccessSales = canAccessSales;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin)
router.put('/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role && ['user', 'administrator'].includes(role)) {
      user.role = role;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
