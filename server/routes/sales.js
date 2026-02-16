const express = require('express');
const router = express.Router();
const SalesOrder = require('../models/SalesOrder');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// @route   POST /api/sales
// @desc    Create a sales order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { clientName, customerNumber, poNumber, products } = req.body;

    // Verify customer exists if customerNumber is provided
    if (customerNumber) {
      const customer = await Customer.findOne({ customerNumber });
      if (!customer) {
        return res.status(400).json({ message: 'Customer not found' });
      }
    }

    const salesOrder = new SalesOrder({
      clientName,
      customerNumber,
      poNumber,
      products,
      createdBy: req.user._id,
      createdByName: req.user.staffId,
      status: 'pending',
      currentStep: 0,
    });

    await salesOrder.save();
    await salesOrder.populate('createdBy', 'staffId email department position');

    res.status(201).json(salesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales
// @desc    Get all sales orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Check if user has access to sales module
    const hasAccess = 
      req.user.role === 'administrator' ||
      req.user.department === 'Commercial' ||
      req.user.department === 'Inventory' ||
      req.user.department === 'Finance' ||
      req.user.permissions.canAccessSales;

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to the Sales module' });
    }

    const query = req.user.role === 'administrator' ? {} : {};
    const orders = await SalesOrder.find(query)
      .populate('createdBy', 'staffId email department position')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/in-progress
// @desc    Get in-progress sales orders
// @access  Private
router.get('/in-progress', auth, async (req, res) => {
  try {
    const hasAccess = 
      req.user.role === 'administrator' ||
      req.user.department === 'Commercial' ||
      req.user.department === 'Inventory' ||
      req.user.department === 'Finance' ||
      req.user.permissions.canAccessSales;

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to the Sales module' });
    }

    const orders = await SalesOrder.find({ status: 'in-progress' })
      .populate('createdBy', 'staffId email department position')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/customers/list
// @desc    Get all customers
// @access  Private
router.get('/customers/list', auth, async (req, res) => {
  try {
    const hasAccess = 
      req.user.role === 'administrator' ||
      req.user.department === 'Commercial' ||
      req.user.department === 'Inventory' ||
      req.user.department === 'Finance' ||
      req.user.permissions.canAccessSales;
    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to the Sales module' });
    }
    const customers = await Customer.find().sort({ customerName: 1 });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/products/list
// @desc    Get all products
// @access  Private
router.get('/products/list', auth, async (req, res) => {
  try {
    const hasAccess = 
      req.user.role === 'administrator' ||
      req.user.department === 'Commercial' ||
      req.user.department === 'Inventory' ||
      req.user.department === 'Finance' ||
      req.user.permissions.canAccessSales;
    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to the Sales module' });
    }
    const products = await Product.find().sort({ productName: 1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/:id
// @desc    Get a single sales order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const hasAccess = 
      req.user.role === 'administrator' ||
      req.user.department === 'Commercial' ||
      req.user.department === 'Inventory' ||
      req.user.department === 'Finance' ||
      req.user.permissions.canAccessSales;

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to the Sales module' });
    }

    const order = await SalesOrder.findById(req.params.id)
      .populate('createdBy', 'staffId email department position');

    if (!order) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/sales/:id/update-step
// @desc    Update a workflow step
// @access  Private
router.put('/:id/update-step', auth, async (req, res) => {
  try {
    const { stepNumber, documentNumber, status, comments } = req.body;
    const order = await SalesOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    const step = order.workflow.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      return res.status(404).json({ message: 'Workflow step not found' });
    }

    // Check for duplicate document numbers
    if (documentNumber) {
      const existingOrder = await SalesOrder.findOne({
        'workflow.documentNumber': documentNumber,
        _id: { $ne: order._id },
      });

      if (existingOrder) {
        return res.status(400).json({ message: 'This document number has already been used' });
      }
    }

    step.status = status || 'completed';
    step.completedBy = req.user._id;
    step.completedByName = req.user.staffId;
    step.completedAt = new Date();
    step.documentNumber = documentNumber || '';
    step.comments = comments || '';

    // Update order status
    if (status === 'rejected') {
      order.status = 'rejected';
      order.rejectedAt = new Date();
      order.rejectionReason = comments || 'Rejected';
    } else {
      // Check if this is the last step
      const lastStep = Math.max(...order.workflow.map((s) => s.stepNumber));
      if (stepNumber === lastStep) {
        order.status = 'completed';
      } else {
        order.status = 'in-progress';
        order.currentStep = stepNumber + 1;
      }
    }

    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales/customers/bulk-upload
// @desc    Bulk upload customers
// @access  Private (Admin)
router.post('/customers/bulk-upload', auth, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied. Administrator rights required.' });
    }

    const { customers } = req.body; // Array of customer objects

    const results = {
      created: [],
      errors: [],
    };

    for (const customerData of customers) {
      try {
        const customer = new Customer(customerData);
        await customer.save();
        results.created.push(customer);
      } catch (error) {
        results.errors.push({ data: customerData, error: error.message });
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales/products/bulk-upload
// @desc    Bulk upload products
// @access  Private (Admin)
router.post('/products/bulk-upload', auth, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied. Administrator rights required.' });
    }

    const { products } = req.body; // Array of product objects

    const results = {
      created: [],
      errors: [],
    };

    for (const productData of products) {
      try {
        const product = new Product(productData);
        await product.save();
        results.created.push(product);
      } catch (error) {
        results.errors.push({ data: productData, error: error.message });
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
