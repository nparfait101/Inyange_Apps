const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Dairy', 'Juice', 'Yoghurt', 'Ghee', 'Butter', 'Cheese', 'Other'],
    default: 'Other'
  },
  subCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    default: 'pcs'
  },
  unitSize: {
    type: String,
    trim: true
  },
  unitWeight: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  ingredients: {
    type: String,
    trim: true
  },
  nutritionalInfo: {
    type: String,
    trim: true
  },
  storageConditions: {
    type: String,
    trim: true
  },
  shelfLife: {
    type: String,
    trim: true
  },
  allergens: {
    type: String,
    trim: true
  },
  standardPrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'RWF'
  },
  vatRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 18
  },
  barcode: {
    type: String,
    trim: true
  },
  minStockLevel: {
    type: Number,
    min: 0,
    default: 0
  },
  maxStockLevel: {
    type: Number,
    min: 0
  },
  currentStock: {
    type: Number,
    min: 0,
    default: 0
  },
  reorderPoint: {
    type: Number,
    min: 0,
    default: 0
  },
  leadTime: {
    type: Number,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
  },
  isPerishable: {
    type: Boolean,
    default: true
  },
  requiresRefrigeration: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create text index for search functionality
productSchema.index({
  productCode: 'text',
  productName: 'text',
  brand: 'text',
  category: 'text',
  description: 'text'
});

module.exports = mongoose.model('Product', productSchema);
