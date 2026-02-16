const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const PettyCashRequest = require('../models/PettyCashRequest');
const { auth, financeAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
    }
  },
});

// @route   POST /api/petty-cash
// @desc    Create a petty cash request
// @access  Private
router.post('/', auth, upload.single('attachment'), async (req, res) => {
  try {
    const {
      names,
      expenseDate,
      reasonOfExpense,
      department,
      amountRequested,
      bankAccount,
      phoneNumber,
      approvalFlow,
    } = req.body;

    const pettyCashRequest = new PettyCashRequest({
      names,
      expenseDate,
      reasonOfExpense,
      department,
      amountRequested,
      attachment: req.file ? req.file.path : undefined,
      bankAccount: bankAccount ? JSON.parse(bankAccount) : undefined,
      phoneNumber: phoneNumber ? JSON.parse(phoneNumber) : undefined,
      requestedBy: req.user._id,
      approvalFlow: approvalFlow ? JSON.parse(approvalFlow) : [],
      currentStep: approvalFlow && JSON.parse(approvalFlow).length > 0 ? 0 : -1,
    });

    await pettyCashRequest.save();
    await pettyCashRequest.populate('requestedBy', 'staffId email department position');

    res.status(201).json(pettyCashRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/petty-cash
// @desc    Get all petty cash requests
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'administrator' ? {} : { requestedBy: req.user._id };
    const requests = await PettyCashRequest.find(query)
      .populate('requestedBy', 'staffId email department position')
      .populate('paidBy', 'staffId email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/petty-cash/approved
// @desc    Get all approved petty cash requests (for finance)
// @access  Private (Finance)
router.get('/approved', financeAuth, async (req, res) => {
  try {
    const requests = await PettyCashRequest.find({ status: 'approved' })
      .populate('requestedBy', 'staffId email department position')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/petty-cash/:id
// @desc    Get a single petty cash request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await PettyCashRequest.findById(req.params.id)
      .populate('requestedBy', 'staffId email department position')
      .populate('paidBy', 'staffId email');

    if (!request) {
      return res.status(404).json({ message: 'Petty cash request not found' });
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

// @route   PUT /api/petty-cash/:id/approve
// @desc    Approve/reject a petty cash request step
// @access  Private
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { stepNumber, status, comments } = req.body;
    const request = await PettyCashRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Petty cash request not found' });
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

// @route   PUT /api/petty-cash/:id/mark-paid
// @desc    Mark petty cash request as paid
// @access  Private (Finance)
router.put('/:id/mark-paid', financeAuth, async (req, res) => {
  try {
    const request = await PettyCashRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Petty cash request not found' });
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
