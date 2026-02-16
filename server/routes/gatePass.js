const express = require('express');
const router = express.Router();
const GatePass = require('../models/GatePass');
const { auth } = require('../middleware/auth');

// @route   POST /api/gate-pass
// @desc    Create a gate pass
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      buyer,
      products,
      transporterName,
      destination,
      itemsDescription,
    } = req.body;

    let totalAmount = 0;
    if (products && products.length > 0) {
      totalAmount = products.reduce((sum, product) => sum + (product.amount || 0), 0);
    }

    const gatePass = new GatePass({
      type,
      initiator: req.user._id,
      initiatorName: req.user.staffId,
      buyer,
      products: products || [],
      totalAmount,
      transporterName,
      destination,
      itemsDescription,
      status: 'pending',
    });

    await gatePass.save();
    await gatePass.populate('initiator', 'staffId email department position');

    res.status(201).json(gatePass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gate-pass
// @desc    Get all gate passes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'administrator' ? {} : { initiator: req.user._id };
    const gatePasses = await GatePass.find(query)
      .populate('initiator', 'staffId email department position')
      .populate('verifiedBy', 'staffId email')
      .sort({ createdAt: -1 });

    res.json(gatePasses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gate-pass/pending
// @desc    Get pending gate passes (for security)
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    const gatePasses = await GatePass.find({ status: 'pending' })
      .populate('initiator', 'staffId email department position')
      .sort({ createdAt: -1 });

    res.json(gatePasses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gate-pass/:id
// @desc    Get a single gate pass
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate('initiator', 'staffId email department position')
      .populate('verifiedBy', 'staffId email');

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    if (req.user.role !== 'administrator' && gatePass.initiator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(gatePass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/gate-pass/:id/verify
// @desc    Verify/approve/reject a gate pass
// @access  Private
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const gatePass = await GatePass.findById(req.params.id);

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    gatePass.status = status;
    gatePass.verifiedBy = req.user._id;
    gatePass.verifiedByName = req.user.staffId;
    gatePass.verifiedAt = new Date();
    gatePass.rejectionReason = rejectionReason || '';
    gatePass.updatedAt = new Date();

    await gatePass.save();

    res.json(gatePass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
