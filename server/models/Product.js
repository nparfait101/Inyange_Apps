const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Dairy', 'Juice', 'Yoghurt', 'Ghee', 'Butter', 'Cheese', 'Other'],
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
