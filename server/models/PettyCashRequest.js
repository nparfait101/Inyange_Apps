const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true,
  },
  approverEmail: {
    type: String,
    required: true,
  },
  approverName: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedAt: Date,
  comments: String,
});

const pettyCashRequestSchema = new mongoose.Schema({
  names: {
    type: String,
    required: true,
  },
  expenseDate: {
    type: Date,
    required: true,
  },
  reasonOfExpense: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['Finance', 'Technical', 'Production', 'Quality', 'HR', 'IT', 'Commercial', 'MD\'office'],
  },
  amountRequested: {
    type: Number,
    required: true,
  },
  attachment: {
    type: String, // File path or URL
  },
  bankAccount: {
    accountNumber: String,
    accountName: String,
  },
  phoneNumber: {
    number: String,
    name: String,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvalFlow: [approvalStepSchema],
  currentStep: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PettyCashRequest', pettyCashRequestSchema);
