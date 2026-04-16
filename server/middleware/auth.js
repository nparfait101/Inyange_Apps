const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' },
      });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin (either legacy role or has admin role)
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check legacy administrator role
    if (req.user.role === 'administrator') {
      return next();
    }

    // Check if user has admin role
    const hasAdminRole = req.user.roles && req.user.roles.some(role => role.name === 'admin');
    if (hasAdminRole) {
      return next();
    }

    res.status(403).json({ message: 'Access denied. Administrator rights required.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Legacy admin auth - kept for backward compatibility
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: 'Access denied. Administrator rights required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const financeAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'administrator' && req.user.department !== 'Finance') {
        return res.status(403).json({ message: 'Access denied. Finance department access required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Check if user has a specific permission
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get all permissions from user's roles
      const userPermissions = req.user.roles
        .flatMap(role => role.permissions || [])
        .map(perm => perm.name);

      if (userPermissions.includes(permissionName)) {
        return next();
      }

      res.status(403).json({ message: `Access denied. Permission '${permissionName}' required.` });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Check if user has any of the given permissions
const hasAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userPermissions = req.user.roles
        .flatMap(role => role.permissions || [])
        .map(perm => perm.name);

      const hasAny = permissionNames.some(permName => userPermissions.includes(permName));

      if (hasAny) {
        return next();
      }

      res.status(403).json({ message: 'Access denied. Required permissions not found.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Check if user has all of the given permissions
const hasAllPermissions = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userPermissions = req.user.roles
        .flatMap(role => role.permissions || [])
        .map(perm => perm.name);

      const hasAll = permissionNames.every(permName => userPermissions.includes(permName));

      if (hasAll) {
        return next();
      }

      res.status(403).json({ message: 'Access denied. All required permissions needed.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { auth, adminAuth, financeAuth, isAdmin, hasPermission, hasAnyPermission, hasAllPermissions };
