const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
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
    cb(null, 'products-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all products with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    const products = await Product.find(filter)
      .sort({ productName: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product
router.post('/', [
  auth,
  body('productCode').notEmpty().withMessage('Product code is required'),
  body('productName').notEmpty().withMessage('Product name is required'),
  body('category').isIn(['Dairy', 'Juice', 'Yoghurt', 'Ghee', 'Butter', 'Cheese', 'Other']).withMessage('Invalid category'),
  body('standardPrice').isFloat({ min: 0 }).withMessage('Standard price must be positive'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('wholesalePrice').optional().isFloat({ min: 0 }).withMessage('Wholesale price must be positive'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be positive'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be positive'),
  body('unitWeight').optional().isFloat({ min: 0 }).withMessage('Unit weight must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode: req.body.productCode });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product code already exists' });
    }
    
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id', [
  auth,
  body('productCode').optional().notEmpty().withMessage('Product code is required'),
  body('productName').optional().notEmpty().withMessage('Product name is required'),
  body('category').optional().isIn(['Dairy', 'Juice', 'Yoghurt', 'Ghee', 'Butter', 'Cheese', 'Other']).withMessage('Invalid category'),
  body('standardPrice').optional().isFloat({ min: 0 }).withMessage('Standard price must be positive'),
  body('unit').optional().notEmpty().withMessage('Unit is required'),
  body('wholesalePrice').optional().isFloat({ min: 0 }).withMessage('Wholesale price must be positive'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be positive'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be positive'),
  body('unitWeight').optional().isFloat({ min: 0 }).withMessage('Unit weight must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product code already exists (excluding current product)
    if (req.body.productCode && req.body.productCode !== product.productCode) {
      const existingProduct = await Product.findOne({ 
        productCode: req.body.productCode,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product code already exists' });
      }
    }
    
    Object.assign(product, req.body);
    await product.save();
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk upload products from CSV
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
          if (!data.productCode || !data.productName) {
            errors.push({
              row: processedCount,
              data: data,
              error: 'Product code and name are required'
            });
            return;
          }
          
          // Check if product already exists
          const existingProduct = await Product.findOne({ productCode: data.productCode });
          if (existingProduct) {
            errors.push({
              row: processedCount,
              data: data,
              error: 'Product code already exists'
            });
            return;
          }
          
          // Prepare product data
          const productData = {
            productCode: data.productCode.trim(),
            productName: data.productName.trim(),
            category: data.category || 'Other',
            subCategory: data.subCategory || '',
            brand: data.brand || '',
            unit: data.unit || 'pcs',
            unitSize: data.unitSize || '',
            unitWeight: parseFloat(data.unitWeight) || 0,
            description: data.description || '',
            ingredients: data.ingredients || '',
            nutritionalInfo: data.nutritionalInfo || '',
            storageConditions: data.storageConditions || '',
            shelfLife: data.shelfLife || '',
            allergens: data.allergens || '',
            standardPrice: parseFloat(data.standardPrice) || 0,
            wholesalePrice: parseFloat(data.wholesalePrice) || 0,
            costPrice: parseFloat(data.costPrice) || 0,
            currency: data.currency || 'RWF',
            vatRate: parseFloat(data.vatRate) || 18,
            barcode: data.barcode || '',
            minStockLevel: parseInt(data.minStockLevel) || 0,
            maxStockLevel: parseInt(data.maxStockLevel) || 0,
            currentStock: parseInt(data.currentStock) || 0,
            reorderPoint: parseInt(data.reorderPoint) || 0,
            leadTime: parseInt(data.leadTime) || 0,
            supplier: data.supplier || '',
            status: data.status || 'Active',
            isPerishable: data.isPerishable === 'true' || data.isPerishable === 'TRUE',
            requiresRefrigeration: data.requiresRefrigeration === 'true' || data.requiresRefrigeration === 'TRUE',
            tags: data.tags ? data.tags.split(';').map(tag => tag.trim()).filter(tag => tag) : [],
            notes: data.notes || ''
          };
          
          const product = new Product(productData);
          await product.save();
          successCount++;
          
          results.push({
            row: processedCount,
            status: 'success',
            product: product
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

// Download product template
router.get('/template/download', auth, async (req, res) => {
  try {
    const template = [
      {
        productCode: 'PROD001',
        productName: 'Fresh Milk',
        category: 'Dairy',
        subCategory: 'Liquid Milk',
        brand: 'Inyange',
        unit: 'liters',
        unitSize: '1L',
        unitWeight: '1',
        description: 'Fresh whole milk',
        ingredients: 'Milk',
        nutritionalInfo: 'Protein: 3.5g, Fat: 3.5g',
        storageConditions: 'Refrigerate at 4°C',
        shelfLife: '7 days',
        allergens: 'Milk',
        standardPrice: '1200',
        wholesalePrice: '1000',
        costPrice: '800',
        currency: 'RWF',
        vatRate: '18',
        barcode: '1234567890123',
        minStockLevel: '50',
        maxStockLevel: '500',
        currentStock: '100',
        reorderPoint: '75',
        leadTime: '2',
        supplier: 'Local Farm',
        status: 'Active',
        isPerishable: 'true',
        requiresRefrigeration: 'true',
        tags: 'fresh;dairy;milk',
        notes: 'Sample product record'
      }
    ];
    
    const csv = [
      'productCode,productName,category,subCategory,brand,unit,unitSize,unitWeight,description,ingredients,nutritionalInfo,storageConditions,shelfLife,allergens,standardPrice,wholesalePrice,costPrice,currency,vatRate,barcode,minStockLevel,maxStockLevel,currentStock,reorderPoint,leadTime,supplier,status,isPerishable,requiresRefrigeration,tags,notes',
      ...template.map(row => 
        `"${row.productCode}","${row.productName}","${row.category}","${row.subCategory}","${row.brand}","${row.unit}","${row.unitSize}","${row.unitWeight}","${row.description}","${row.ingredients}","${row.nutritionalInfo}","${row.storageConditions}","${row.shelfLife}","${row.allergens}","${row.standardPrice}","${row.wholesalePrice}","${row.costPrice}","${row.currency}","${row.vatRate}","${row.barcode}","${row.minStockLevel}","${row.maxStockLevel}","${row.currentStock}","${row.reorderPoint}","${row.leadTime}","${row.supplier}","${row.status}","${row.isPerishable}","${row.requiresRefrigeration}","${row.tags}","${row.notes}"`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products-template.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search products
router.get('/search/query', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const products = await Product.find({
      $and: [
        { status: 'Active' },
        { $text: { $search: q } }
      ]
    }).select('productCode productName category brand standardPrice unit currentStock')
    .limit(20);
    
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
