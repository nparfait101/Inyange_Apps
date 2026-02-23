const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Government', 'NGO', 'Private', 'Individual'],
    default: 'Private'
  },
  category: {
    type: String,
    enum: ['Institution', 'Retailer', 'Distributor', 'Restaurant', 'Hotel', 'School', 'Hospital', 'Other'],
    default: 'Other'
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'Rwanda'
  },
  tinNumber: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['Cash', '7 Days', '14 Days', '30 Days', '60 Days', '90 Days'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
