const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: String,
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
});

const workflowStepSchema = new mongoose.Schema({
  stepName: {
    type: String,
    required: true,
  },
  stepNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending',
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  completedByName: String,
  completedAt: Date,
  documentNumber: String, // Sales order number, delivery number, invoice number, etc.
  comments: String,
});

const salesOrderSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  customerNumber: String, // SAP customer number
  poNumber: String,
  products: [productSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByName: String,
  workflow: [workflowStepSchema],
  currentStep: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending',
  },
  rejectedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Initialize workflow steps
salesOrderSchema.pre('save', function (next) {
  if (this.isNew && this.workflow.length === 0) {
    this.workflow = [
      { stepName: 'Sales Order', stepNumber: 1, status: 'pending' },
      { stepName: 'Loading', stepNumber: 2, status: 'pending' },
      { stepName: 'Delivery', stepNumber: 3, status: 'pending' },
      { stepName: 'Invoice', stepNumber: 4, status: 'pending' },
      { stepName: 'Gate/Exit 1', stepNumber: 5, status: 'pending' },
      { stepName: 'Weighbridge', stepNumber: 6, status: 'pending' },
      { stepName: 'Gate/Exit 2', stepNumber: 7, status: 'pending' },
    ];
  }
  next();
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
