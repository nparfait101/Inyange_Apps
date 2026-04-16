const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const gatePassSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['canteen', 'general'],
    required: true,
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  initiatorName: String,
  // For canteen gate passes
  buyer: String,
  products: [productItemSchema],
  totalAmount: Number,
  // For general gate passes
  transporterName: String,
  destination: String,
  itemsDescription: String,
  // Security verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedByName: String,
  verifiedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: String,
  // Two-step approval process
  printedAt: Date,
  printedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  printedByName: String,
  checkoutApprovedAt: Date,
  checkoutApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  checkoutApprovedByName: String,
  verificationCode: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GatePass', gatePassSchema);
