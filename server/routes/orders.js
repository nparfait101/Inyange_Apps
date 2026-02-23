const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const { body, validationResult } = require('express-validator');

// Get all orders with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customerName = { $regex: req.query.customer, $options: 'i' };
    if (req.query.orderNumber) filter.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }
    
    const orders = await Order.find(filter)
      .populate('customer', 'customerNumber customerName type')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'customerNumber customerName type email phone address')
      .populate('createdBy', 'name email')
      .populate('workflow.updatedBy', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
router.post('/', [
  auth,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.product').notEmpty().withMessage('Product ID is required'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('products.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('deliveryAddress').optional().isString().trim(),
  body('contactPerson').optional().isString().trim(),
  body('contactPhone').optional().isString().trim(),
  body('notes').optional().isString().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { customer, poNumber, products, deliveryAddress, contactPerson, contactPhone, notes, priority } = req.body;
    
    // Validate customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Validate products and get details
    const productIds = products.map(p => p.product);
    const productDocs = await Product.find({ _id: { $in: productIds } });
    
    if (productDocs.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products not found' });
    }
    
    // Calculate expected weight
    let expectedWeight = 0;
    const orderProducts = products.map(product => {
      const productDoc = productDocs.find(p => p._id.toString() === product.product);
      const unitWeight = productDoc.unitWeight || 0;
      const totalWeight = product.quantity * unitWeight;
      expectedWeight += totalWeight;
      
      return {
        product: product.product,
        productName: productDoc.productName,
        productCode: productDoc.productCode,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.quantity * product.unitPrice
      };
    });
    
    const order = new Order({
      customer: customer,
      customerName: customerDoc.customerName,
      customerNumber: customerDoc.customerNumber,
      poNumber: poNumber,
      products: orderProducts,
      deliveryAddress: deliveryAddress || customerDoc.address,
      contactPerson: contactPerson || customerDoc.contactPerson,
      contactPhone: contactPhone || customerDoc.phone,
      notes: notes,
      priority: priority || 'medium',
      expectedWeight: expectedWeight,
      createdBy: req.user.id,
      createdByName: req.user.name
    });
    
    await order.save();
    
    // Populate customer and creator info for response
    await order.populate('customer', 'customerNumber customerName type');
    await order.populate('createdBy', 'name email');
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update workflow step
router.patch('/:id/workflow/:step', [
  auth,
  body('status').isIn(['pending', 'in_progress', 'completed', 'rejected']).withMessage('Invalid status'),
  body('documentNumber').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  body('rejectionReason').optional().isString().trim(),
  body('actualWeight').optional().isFloat({ min: 0 }).withMessage('Actual weight must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id, step } = req.params;
    const { status, documentNumber, notes, rejectionReason, actualWeight } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Validate step number
    const stepNum = parseInt(step);
    if (stepNum < 1 || stepNum > 7) {
      return res.status(400).json({ message: 'Invalid workflow step' });
    }
    
    // Check if document number is already used
    if (documentNumber) {
      const existingOrder = await Order.isDocumentNumberUsed(documentNumber, id);
      if (existingOrder) {
        return res.status(400).json({ 
          message: `Document number ${documentNumber} is already used in order ${existingOrder.orderNumber}` 
        });
      }
    }
    
    // Update workflow step
    try {
      await order.updateWorkflowStep(stepNum, {
        status,
        documentNumber,
        notes,
        rejectionReason,
        actualWeight
      }, req.user.id, req.user.name);
      
      // Get updated order with populated data
      const updatedOrder = await Order.findById(id)
        .populate('customer', 'customerNumber customerName type')
        .populate('createdBy', 'name email')
        .populate('workflow.updatedBy', 'name email');
      
      res.json(updatedOrder);
    } catch (error) {
      if (error.message.includes('already used')) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating workflow step:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order statistics
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const orders = await Order.find({});
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      byStep: {
        step1: orders.filter(o => o.currentStep === 1).length,
        step2: orders.filter(o => o.currentStep === 2).length,
        step3: orders.filter(o => o.currentStep === 3).length,
        step4: orders.filter(o => o.currentStep === 4).length,
        step5: orders.filter(o => o.currentStep === 5).length,
        step6: orders.filter(o => o.currentStep === 6).length,
        step7: orders.filter(o => o.currentStep === 7).length
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order (only if not processed)
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow deletion if order is still pending
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete order that is already in progress' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders by customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ customer: req.params.customerId })
      .populate('customer', 'customerNumber customerName type')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments({ customer: req.params.customerId });
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
