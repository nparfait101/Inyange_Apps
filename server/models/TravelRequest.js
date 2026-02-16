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

const travelRequestSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'M1', 'M2', 'M3', 'M4'],
  },
  travelPurpose: {
    type: String,
    required: true,
  },
  dateOfDeparture: {
    type: Date,
    required: true,
  },
  dateOfReturn: {
    type: Date,
    required: true,
  },
  travelType: {
    type: String,
    required: true,
    enum: ['Domestic', 'Foreign'],
  },
  financingCompany: {
    type: String,
    required: true,
    enum: ['INYANGE', 'MPP', 'MUKAMIRA', 'GIHEKE'],
  },
  department: {
    type: String,
    required: true,
    enum: ['Finance', 'Technical', 'Production', 'Quality', 'HR', 'IT', 'Commercial', 'MD\'office'],
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

module.exports = mongoose.model('TravelRequest', travelRequestSchema);
