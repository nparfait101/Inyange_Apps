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

const fuelRequestSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  dateOfRequest: {
    type: Date,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['Finance', 'Technical', 'Production', 'Quality', 'HR', 'IT', 'Commercial', 'MD\'office'],
  },
  typeOfRequest: {
    type: String,
    required: true,
    enum: ['Fuel', 'vehicle'],
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
    enum: ['pending', 'approved', 'rejected', 'served'],
    default: 'pending',
  },
  servedAt: Date,
  servedBy: {
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

module.exports = mongoose.model('FuelRequest', fuelRequestSchema);
