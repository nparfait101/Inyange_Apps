const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const workflowStepSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6, 7]
  },
  stepName: {
    type: String,
    required: true,
    enum: [
      'Sales Order Creation',
      'Warehouse Loading',
      'Delivery',
      'Invoice',
      'Gate Exit 1',
      'Weighbridge',
      'Gate Exit 2'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedByName: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  documentNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerNumber: {
    type: String,
    required: true
  },
  poNumber: {
    type: String,
    trim: true
  },
  products: [orderProductSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'RWF'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  currentStep: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 7
  },
  workflow: [workflowStepSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expectedWeight: {
    type: Number,
    min: 0
  },
  actualWeight: {
    type: Number,
    min: 0
  },
  weightVariance: {
    type: Number
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

// Initialize workflow steps when creating a new order
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.workflow = [
      { step: 1, stepName: 'Sales Order Creation', status: 'pending' },
      { step: 2, stepName: 'Warehouse Loading', status: 'pending' },
      { step: 3, stepName: 'Delivery', status: 'pending' },
      { step: 4, stepName: 'Invoice', status: 'pending' },
      { step: 5, stepName: 'Gate Exit 1', status: 'pending' },
      { step: 6, stepName: 'Weighbridge', status: 'pending' },
      { step: 7, stepName: 'Gate Exit 2', status: 'pending' }
    ];
  }
  next();
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `ORD-${year}${month}`;
    
    try {
      const lastOrder = await this.constructor.findOne({
        orderNumber: { $regex: `^${prefix}` }
      }).sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      this.orderNumber = `${prefix}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      this.orderNumber = `${prefix}-0001`;
    }
  }
  next();
});

// Update total amount when products change
orderSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    this.totalAmount = this.products.reduce((total, product) => {
      return total + (product.quantity * product.unitPrice);
    }, 0);
  }
  next();
});

// Update the updatedAt field
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to update workflow step
orderSchema.methods.updateWorkflowStep = function(step, updateData, userId, userName) {
  const workflowStep = this.workflow.find(w => w.step === step);
  if (!workflowStep) {
    throw new Error(`Workflow step ${step} not found`);
  }
  
  // Check if document number is already used
  if (updateData.documentNumber) {
    return this.constructor.findOne({
      'workflow.documentNumber': updateData.documentNumber,
      _id: { $ne: this._id }
    }).then(existingOrder => {
      if (existingOrder) {
        throw new Error(`Document number ${updateData.documentNumber} is already used in order ${existingOrder.orderNumber}`);
      }
      
      workflowStep.status = updateData.status || workflowStep.status;
      workflowStep.documentNumber = updateData.documentNumber;
      workflowStep.notes = updateData.notes;
      workflowStep.rejectionReason = updateData.rejectionReason;
      workflowStep.updatedBy = userId;
      workflowStep.updatedByName = userName;
      workflowStep.updatedAt = new Date();
      
      // Update current step and overall status
      if (updateData.status === 'completed' && step >= this.currentStep) {
        this.currentStep = step + 1;
        if (this.currentStep > 7) {
          this.status = 'completed';
          this.currentStep = 7;
        }
      } else if (updateData.status === 'rejected') {
        this.status = 'cancelled';
      } else if (updateData.status === 'in_progress' && step === this.currentStep) {
        this.status = 'in_progress';
      }
      
      // Handle weighbridge specific logic
      if (step === 6 && updateData.actualWeight) {
        this.actualWeight = updateData.actualWeight;
        this.weightVariance = updateData.actualWeight - (this.expectedWeight || 0);
      }
      
      return this.save();
    });
  } else {
    workflowStep.status = updateData.status || workflowStep.status;
    workflowStep.notes = updateData.notes;
    workflowStep.rejectionReason = updateData.rejectionReason;
    workflowStep.updatedBy = userId;
    workflowStep.updatedByName = userName;
    workflowStep.updatedAt = new Date();
    
    // Update current step and overall status
    if (updateData.status === 'completed' && step >= this.currentStep) {
      this.currentStep = step + 1;
      if (this.currentStep > 7) {
        this.status = 'completed';
        this.currentStep = 7;
      }
    } else if (updateData.status === 'rejected') {
      this.status = 'cancelled';
    } else if (updateData.status === 'in_progress' && step === this.currentStep) {
      this.status = 'in_progress';
    }
    
    // Handle weighbridge specific logic
    if (step === 6 && updateData.actualWeight) {
      this.actualWeight = updateData.actualWeight;
      this.weightVariance = updateData.actualWeight - (this.expectedWeight || 0);
    }
    
    return this.save();
  }
};

// Static method to check if document number is used
orderSchema.statics.isDocumentNumberUsed = function(documentNumber, excludeOrderId = null) {
  const query = { 'workflow.documentNumber': documentNumber };
  if (excludeOrderId) {
    query._id = { $ne: excludeOrderId };
  }
  return this.findOne(query);
};

module.exports = mongoose.model('Order', orderSchema);
