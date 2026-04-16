const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/travel', require('./routes/travel'));
app.use('/api/fuel', require('./routes/fuel'));
app.use('/api/petty-cash', require('./routes/pettyCash'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/gate-pass', require('./routes/gatePass'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles-permissions', require('./routes/rolesPermissions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'InyangeApps API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inyange-apps', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
