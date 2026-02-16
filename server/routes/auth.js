const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('position').notEmpty().withMessage('Position is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { staffId, email, password, phoneNumber, department, position } = req.body;

      // Check if user already exists
      let user = await User.findOne({ $or: [{ staffId }, { email }] });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this Staff ID or Email' });
      }

      // Create new user
      user = new User({
        staffId,
        email,
        password,
        phoneNumber,
        department,
        position,
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          staffId: user.staffId,
          email: user.email,
          department: user.department,
          position: user.position,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username (Staff ID or Email) is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user by staffId or email
      const user = await User.findOne({
        $or: [{ staffId: username }, { email: username }],
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user._id);

      res.json({
        token,
        user: {
          id: user._id,
          staffId: user.staffId,
          email: user.email,
          department: user.department,
          position: user.position,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
