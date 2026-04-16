const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// ============ PERMISSIONS ROUTES ============

// @route   GET /api/roles-permissions/permissions
// @desc    Get all permissions
// @access  Private/Admin
router.get('/permissions', auth, isAdmin, async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, displayName: 1 });
    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/permissions
// @desc    Create a new permission
// @access  Private/Admin
router.post('/permissions', auth, isAdmin, async (req, res) => {
  try {
    const { name, displayName, description, category } = req.body;

    // Check if permission already exists
    let permission = await Permission.findOne({ name });
    if (permission) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    permission = new Permission({
      name,
      displayName,
      description,
      category,
    });

    await permission.save();
    res.status(201).json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles-permissions/permissions/:id
// @desc    Get a permission by ID
// @access  Private/Admin
router.get('/permissions/:id', auth, isAdmin, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/roles-permissions/permissions/:id
// @desc    Update a permission
// @access  Private/Admin
router.put('/permissions/:id', auth, isAdmin, async (req, res) => {
  try {
    const { displayName, description, category } = req.body;
    let permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    permission.displayName = displayName || permission.displayName;
    permission.description = description || permission.description;
    permission.category = category || permission.category;

    await permission.save();
    res.json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles-permissions/permissions/:id
// @desc    Delete a permission
// @access  Private/Admin
router.delete('/permissions/:id', auth, isAdmin, async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Remove permission from all roles
    await Role.updateMany({}, { $pull: { permissions: req.params.id } });

    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ROLES ROUTES ============

// @route   GET /api/roles-permissions/roles
// @desc    Get all roles with their permissions
// @access  Private/Admin
router.get('/roles', auth, isAdmin, async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions', 'name displayName category')
      .sort({ isSystem: -1, displayName: 1 });
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/roles
// @desc    Create a new role
// @access  Private/Admin
router.post('/roles', auth, isAdmin, async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    // Check if role already exists
    let role = await Role.findOne({ name });
    if (role) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    role = new Role({
      name,
      displayName,
      description,
      permissions: permissions || [],
    });

    await role.save();
    await role.populate('permissions', 'name displayName category');

    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles-permissions/roles/:id
// @desc    Get a role by ID
// @access  Private/Admin
router.get('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions', 'name displayName category');
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/roles-permissions/roles/:id
// @desc    Update a role
// @access  Private/Admin
router.put('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const { displayName, description, permissions } = req.body;
    let role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent modification of system roles
    if (role.isSystem) {
      return res.status(403).json({ message: 'System roles cannot be modified' });
    }

    role.displayName = displayName || role.displayName;
    role.description = description || role.description;
    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();
    await role.populate('permissions', 'name displayName category');

    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles-permissions/roles/:id
// @desc    Delete a role
// @access  Private/Admin
router.delete('/roles/:id', auth, isAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      return res.status(403).json({ message: 'System roles cannot be deleted' });
    }

    await Role.findByIdAndDelete(req.params.id);

    // Remove role from all users
    await User.updateMany({}, { $pull: { roles: req.params.id } });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ USER ROLES ASSIGNMENT ============

// @route   POST /api/roles-permissions/assign-role
// @desc    Assign a role to a user
// @access  Private/Admin
router.post('/assign-role', auth, isAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if user already has the role
    if (user.roles.includes(roleId)) {
      return res.status(400).json({ message: 'User already has this role' });
    }

    user.roles.push(roleId);
    await user.save();
    await user.populate('roles', 'name displayName');

    res.json({ message: 'Role assigned successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/remove-role
// @desc    Remove a role from a user
// @access  Private/Admin
router.post('/remove-role', auth, isAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has the role
    if (!user.roles.includes(roleId)) {
      return res.status(400).json({ message: 'User does not have this role' });
    }

    user.roles = user.roles.filter(role => !role.equals(roleId));
    await user.save();
    await user.populate('roles', 'name displayName');

    res.json({ message: 'Role removed successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/sync-user-roles
// @desc    Sync multiple roles for a user (replace all existing roles)
// @access  Private/Admin
router.post('/sync-user-roles', auth, isAdmin, async (req, res) => {
  try {
    const { userId, roleIds } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify all roles exist
    const roles = await Role.find({ _id: { $in: roleIds } });
    if (roles.length !== roleIds.length) {
      return res.status(400).json({ message: 'One or more roles not found' });
    }

    user.roles = roleIds;
    await user.save();
    await user.populate('roles', 'name displayName');

    res.json({ message: 'Roles synced successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles-permissions/user/:userId/roles
// @desc    Get all roles for a user
// @access  Private
router.get('/user/:userId/roles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('roles');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles-permissions/user/:userId/permissions
// @desc    Get all permissions for a user (from all roles)
// @access  Private
router.get('/user/:userId/permissions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: 'roles',
      populate: { path: 'permissions' },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = user.roles
      .flatMap(role => role.permissions)
      .filter((perm, index, self) => index === self.findIndex(p => p._id.equals(perm._id)));

    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/role/:roleId/add-permission
// @desc    Add a permission to a role
// @access  Private/Admin
router.post('/role/:roleId/add-permission', auth, isAdmin, async (req, res) => {
  try {
    const { permissionId } = req.body;
    const role = await Role.findById(req.params.roleId);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Check if role already has the permission
    if (role.permissions.includes(permissionId)) {
      return res.status(400).json({ message: 'Role already has this permission' });
    }

    role.permissions.push(permissionId);
    await role.save();
    await role.populate('permissions', 'name displayName category');

    res.json({ message: 'Permission added to role', role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles-permissions/role/:roleId/remove-permission
// @desc    Remove a permission from a role
// @access  Private/Admin
router.post('/role/:roleId/remove-permission', auth, isAdmin, async (req, res) => {
  try {
    const { permissionId } = req.body;
    const role = await Role.findById(req.params.roleId);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if role has the permission
    if (!role.permissions.includes(permissionId)) {
      return res.status(400).json({ message: 'Role does not have this permission' });
    }

    role.permissions = role.permissions.filter(perm => !perm.equals(permissionId));
    await role.save();
    await role.populate('permissions', 'name displayName category');

    res.json({ message: 'Permission removed from role', role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
