const express = require('express');
const router = express.Router();
const FuelRequest = require('../models/FuelRequest');
const { auth, financeAuth } = require('../middleware/auth');

// @route   POST /api/fuel
// @desc    Create a fuel/vehicle request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      employeeName,
      dateOfRequest,
      purpose,
      department,
      typeOfRequest,
      approvalFlow,
    } = req.body;

    const fuelRequest = new FuelRequest({
      employeeName,
      dateOfRequest,
      purpose,
      department,
      typeOfRequest,
      requestedBy: req.user._id,
      approvalFlow: approvalFlow || [],
      currentStep: approvalFlow && approvalFlow.length > 0 ? 0 : -1,
    });

    await fuelRequest.save();
    await fuelRequest.populate('requestedBy', 'staffId email department position');

    res.status(201).json(fuelRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fuel
// @desc    Get all fuel requests
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'administrator' ? {} : { requestedBy: req.user._id };
    const requests = await FuelRequest.find(query)
      .populate('requestedBy', 'staffId email department position')
      .populate('servedBy', 'staffId email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fuel/:id
// @desc    Get a single fuel request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await FuelRequest.findById(req.params.id)
      .populate('requestedBy', 'staffId email department position')
      .populate('servedBy', 'staffId email');

    if (!request) {
      return res.status(404).json({ message: 'Fuel request not found' });
    }

    if (req.user.role !== 'administrator' && request.requestedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/fuel/:id/approve
// @desc    Approve/reject a fuel request step
// @access  Private
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { stepNumber, status, comments } = req.body;
    const request = await FuelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Fuel request not found' });
    }

    const step = request.approvalFlow.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      return res.status(404).json({ message: 'Approval step not found' });
    }

    if (step.approverEmail !== req.user.email && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'You are not authorized to approve this step' });
    }

    step.status = status;
    step.approvedAt = new Date();
    step.comments = comments || '';
    step.approverName = req.user.staffId;

    if (status === 'rejected') {
      request.status = 'rejected';
    } else if (status === 'approved') {
      const lastStep = Math.max(...request.approvalFlow.map((s) => s.stepNumber));
      if (stepNumber === lastStep) {
        request.status = 'approved';
      } else {
        request.currentStep = stepNumber + 1;
      }
    }

    request.updatedAt = new Date();
    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/fuel/:id/mark-served
// @desc    Mark fuel request as served
// @access  Private (Finance or authorized)
router.put('/:id/mark-served', auth, async (req, res) => {
  try {
    const request = await FuelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Fuel request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Request must be approved before marking as served' });
    }

    // Check if user has permission
    if (!req.user.permissions.canMarkServed && req.user.role !== 'administrator' && req.user.department !== 'Finance') {
      return res.status(403).json({ message: 'You do not have permission to mark requests as served' });
    }

    request.status = 'served';
    request.servedAt = new Date();
    request.servedBy = req.user._id;
    request.updatedAt = new Date();

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
