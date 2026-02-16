const express = require('express');
const router = express.Router();
const TravelRequest = require('../models/TravelRequest');
const { auth, financeAuth } = require('../middleware/auth');

// @route   POST /api/travel
// @desc    Create a travel request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      employeeName,
      position,
      grade,
      travelPurpose,
      dateOfDeparture,
      dateOfReturn,
      travelType,
      financingCompany,
      department,
      approvalFlow,
    } = req.body;

    const travelRequest = new TravelRequest({
      employeeName,
      position,
      grade,
      travelPurpose,
      dateOfDeparture,
      dateOfReturn,
      travelType,
      financingCompany,
      department,
      requestedBy: req.user._id,
      approvalFlow: approvalFlow || [],
      currentStep: approvalFlow && approvalFlow.length > 0 ? 0 : -1,
    });

    await travelRequest.save();
    await travelRequest.populate('requestedBy', 'staffId email department position');

    res.status(201).json(travelRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel
// @desc    Get all travel requests (user's own or all if admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'administrator' ? {} : { requestedBy: req.user._id };
    const requests = await TravelRequest.find(query)
      .populate('requestedBy', 'staffId email department position')
      .populate('paidBy', 'staffId email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel/approved
// @desc    Get all approved travel requests (for finance)
// @access  Private (Finance)
router.get('/approved', financeAuth, async (req, res) => {
  try {
    const requests = await TravelRequest.find({ status: 'approved' })
      .populate('requestedBy', 'staffId email department position')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel/:id
// @desc    Get a single travel request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await TravelRequest.findById(req.params.id)
      .populate('requestedBy', 'staffId email department position')
      .populate('paidBy', 'staffId email');

    if (!request) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Check if user has access
    if (req.user.role !== 'administrator' && request.requestedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/travel/:id/approve
// @desc    Approve/reject a travel request step
// @access  Private
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { stepNumber, status, comments } = req.body;
    const request = await TravelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Travel request not found' });
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
      // Check if this is the last step
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

// @route   PUT /api/travel/:id/mark-paid
// @desc    Mark travel request as paid
// @access  Private (Finance)
router.put('/:id/mark-paid', financeAuth, async (req, res) => {
  try {
    const request = await TravelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Request must be approved before marking as paid' });
    }

    request.status = 'paid';
    request.paidAt = new Date();
    request.paidBy = req.user._id;
    request.updatedAt = new Date();

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
