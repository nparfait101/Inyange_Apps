const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'customers-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all customers with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { customerNumber: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(filter)
      .sort({ customerName: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(filter);
    
    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single customer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new customer
router.post('/', [
  auth,
  body('customerNumber').notEmpty().withMessage('Customer number is required'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('city').optional().isString().trim(),
  body('province').optional().isString().trim(),
  body('tinNumber').optional().isString().trim(),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be positive'),
  body('paymentTerms').optional().isIn(['Cash', '7 Days', '14 Days', '30 Days', '60 Days', '90 Days'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if customer number already exists
    const existingCustomer = await Customer.findOne({ customerNumber: req.body.customerNumber });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer number already exists' });
    }
    
    // Check if email already exists
    if (req.body.email) {
      const existingEmail = await Customer.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    const customer = new Customer(req.body);
    await customer.save();
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer
router.put('/:id', [
  auth,
  body('customerNumber').optional().notEmpty().withMessage('Customer number is required'),
  body('customerName').optional().notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('city').optional().isString().trim(),
  body('province').optional().isString().trim(),
  body('tinNumber').optional().isString().trim(),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit must be positive'),
  body('paymentTerms').optional().isIn(['Cash', '7 Days', '14 Days', '30 Days', '60 Days', '90 Days'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if customer number already exists (excluding current customer)
    if (req.body.customerNumber && req.body.customerNumber !== customer.customerNumber) {
      const existingCustomer = await Customer.findOne({ 
        customerNumber: req.body.customerNumber,
        _id: { $ne: req.params.id }
      });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer number already exists' });
      }
    }
    
    // Check if email already exists (excluding current customer)
    if (req.body.email && req.body.email !== customer.email) {
      const existingEmail = await Customer.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    Object.assign(customer, req.body);
    await customer.save();
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk upload customers from CSV
router.post('/bulk-upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const results = [];
    const errors = [];
    let processedCount = 0;
    let successCount = 0;
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        processedCount++;
        
        try {
          // Validate required fields
          if (!data.customerNumber || !data.customerName) {
            errors.push({
              row: processedCount,
              data: data,
              error: 'Customer number and name are required'
            });
            return;
          }
          
          // Check if customer already exists
          const existingCustomer = await Customer.findOne({ customerNumber: data.customerNumber });
          if (existingCustomer) {
            errors.push({
              row: processedCount,
              data: data,
              error: 'Customer number already exists'
            });
            return;
          }
          
          // Prepare customer data
          const customerData = {
            customerNumber: data.customerNumber.trim(),
            customerName: data.customerName.trim(),
            type: data.type || 'Private',
            category: data.category || 'Other',
            contactPerson: data.contactPerson || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            province: data.province || '',
            country: data.country || 'Rwanda',
            tinNumber: data.tinNumber || '',
            creditLimit: parseFloat(data.creditLimit) || 0,
            paymentTerms: data.paymentTerms || 'Cash',
            status: data.status || 'Active',
            notes: data.notes || ''
          };
          
          const customer = new Customer(customerData);
          await customer.save();
          successCount++;
          
          results.push({
            row: processedCount,
            status: 'success',
            customer: customer
          });
          
        } catch (error) {
          errors.push({
            row: processedCount,
            data: data,
            error: error.message
          });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          message: 'Bulk upload completed',
          processed: processedCount,
          success: successCount,
          errors: errors.length,
          results: results,
          errorDetails: errors
        });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing CSV file' });
      });
    
  } catch (error) {
    console.error('Error in bulk upload:', error);
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Download customer template
router.get('/template/download', auth, async (req, res) => {
  try {
    const template = [
      {
        customerNumber: 'CUST001',
        customerName: 'Example Customer',
        type: 'Private',
        category: 'Retailer',
        contactPerson: 'John Doe',
        email: 'john@example.com',
        phone: '+250788123456',
        address: '123 Main Street',
        city: 'Kigali',
        province: 'Kigali',
        country: 'Rwanda',
        tinNumber: '123456789',
        creditLimit: '1000000',
        paymentTerms: '30 Days',
        status: 'Active',
        notes: 'Sample customer record'
      }
    ];
    
    const csv = [
      'customerNumber,customerName,type,category,contactPerson,email,phone,address,city,province,country,tinNumber,creditLimit,paymentTerms,status,notes',
      ...template.map(row => 
        `"${row.customerNumber}","${row.customerName}","${row.type}","${row.category}","${row.contactPerson}","${row.email}","${row.phone}","${row.address}","${row.city}","${row.province}","${row.country}","${row.tinNumber}","${row.creditLimit}","${row.paymentTerms}","${row.status}","${row.notes}"`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers-template.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
