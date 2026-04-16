/**
 * Seed script to initialize default roles and permissions
 * Run: node server/seeds/initializeRolesPermissions.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

dotenv.config();

const defaultPermissions = [
  // Travel
  { name: 'travel.create', displayName: 'Create Travel Request', category: 'travel' },
  { name: 'travel.view', displayName: 'View Travel Requests', category: 'travel' },
  { name: 'travel.edit', displayName: 'Edit Travel Requests', category: 'travel' },
  { name: 'travel.delete', displayName: 'Delete Travel Requests', category: 'travel' },
  { name: 'travel.approve', displayName: 'Approve Travel Requests', category: 'travel' },
  { name: 'travel.mark_completed', displayName: 'Mark Travel as Completed', category: 'travel' },

  // Fuel
  { name: 'fuel.create', displayName: 'Create Fuel Request', category: 'fuel' },
  { name: 'fuel.view', displayName: 'View Fuel Requests', category: 'fuel' },
  { name: 'fuel.edit', displayName: 'Edit Fuel Requests', category: 'fuel' },
  { name: 'fuel.delete', displayName: 'Delete Fuel Requests', category: 'fuel' },
  { name: 'fuel.approve', displayName: 'Approve Fuel Requests', category: 'fuel' },

  // Petty Cash
  { name: 'petty-cash.create', displayName: 'Create Petty Cash Request', category: 'petty-cash' },
  { name: 'petty-cash.view', displayName: 'View Petty Cash Requests', category: 'petty-cash' },
  { name: 'petty-cash.edit', displayName: 'Edit Petty Cash Requests', category: 'petty-cash' },
  { name: 'petty-cash.delete', displayName: 'Delete Petty Cash Requests', category: 'petty-cash' },
  { name: 'petty-cash.approve', displayName: 'Approve Petty Cash Requests', category: 'petty-cash' },
  { name: 'petty-cash.mark_paid', displayName: 'Mark Petty Cash as Paid', category: 'petty-cash' },

  // Sales
  { name: 'sales.create', displayName: 'Create Sales Order', category: 'sales' },
  { name: 'sales.view', displayName: 'View Sales Orders', category: 'sales' },
  { name: 'sales.edit', displayName: 'Edit Sales Orders', category: 'sales' },
  { name: 'sales.delete', displayName: 'Delete Sales Orders', category: 'sales' },
  { name: 'sales.mark_served', displayName: 'Mark Sales as Served', category: 'sales' },

  // Gate Pass
  { name: 'gate-pass.create', displayName: 'Create Gate Pass', category: 'gate-pass' },
  { name: 'gate-pass.view', displayName: 'View Gate Passes', category: 'gate-pass' },
  { name: 'gate-pass.edit', displayName: 'Edit Gate Passes', category: 'gate-pass' },
  { name: 'gate-pass.delete', displayName: 'Delete Gate Passes', category: 'gate-pass' },
  { name: 'gate-pass.approve', displayName: 'Approve Gate Passes', category: 'gate-pass' },

  // Users
  { name: 'users.create', displayName: 'Create Users', category: 'users' },
  { name: 'users.view', displayName: 'View Users', category: 'users' },
  { name: 'users.edit', displayName: 'Edit Users', category: 'users' },
  { name: 'users.delete', displayName: 'Delete Users', category: 'users' },

  // Reports
  { name: 'reports.view', displayName: 'View Reports', category: 'reports' },
  { name: 'reports.export', displayName: 'Export Reports', category: 'reports' },

  // Admin
  { name: 'admin.manage_roles', displayName: 'Manage Roles', category: 'admin' },
  { name: 'admin.manage_permissions', displayName: 'Manage Permissions', category: 'admin' },
  { name: 'admin.manage_users', displayName: 'Manage Users', category: 'admin' },
];

const defaultRoles = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissionNames: [
      'travel.create', 'travel.view', 'travel.edit', 'travel.delete', 'travel.approve', 'travel.mark_completed',
      'fuel.create', 'fuel.view', 'fuel.edit', 'fuel.delete', 'fuel.approve',
      'petty-cash.create', 'petty-cash.view', 'petty-cash.edit', 'petty-cash.delete', 'petty-cash.approve', 'petty-cash.mark_paid',
      'sales.create', 'sales.view', 'sales.edit', 'sales.delete', 'sales.mark_served',
      'gate-pass.create', 'gate-pass.view', 'gate-pass.edit', 'gate-pass.delete', 'gate-pass.approve',
      'users.create', 'users.view', 'users.edit', 'users.delete',
      'reports.view', 'reports.export',
      'admin.manage_roles', 'admin.manage_permissions', 'admin.manage_users',
    ],
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Can create, view, and approve requests',
    isSystem: true,
    permissionNames: [
      'travel.create', 'travel.view', 'travel.approve',
      'fuel.create', 'fuel.view', 'fuel.approve',
      'petty-cash.create', 'petty-cash.view', 'petty-cash.approve',
      'sales.create', 'sales.view', 'sales.mark_served',
      'gate-pass.create', 'gate-pass.view', 'gate-pass.approve',
      'reports.view',
    ],
  },
  {
    name: 'finance',
    displayName: 'Finance Officer',
    description: 'Handles financial operations',
    isSystem: true,
    permissionNames: [
      'travel.view', 'travel.mark_completed',
      'fuel.view',
      'petty-cash.view', 'petty-cash.mark_paid',
      'sales.view', 'sales.mark_served',
      'gate-pass.view',
      'reports.view', 'reports.export',
    ],
  },
  {
    name: 'employee',
    displayName: 'Employee',
    description: 'Basic user access',
    isSystem: true,
    permissionNames: [
      'travel.create', 'travel.view',
      'fuel.create', 'fuel.view',
      'petty-cash.create', 'petty-cash.view',
      'sales.create', 'sales.view',
      'gate-pass.create', 'gate-pass.view',
    ],
  },
];

const initializeRolesPermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inyange-apps', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create permissions
    console.log('Creating permissions...');
    const createdPermissions = await Permission.insertMany(defaultPermissions, { ordered: false }).catch(
      (err) => {
        if (err.code === 11000) {
          console.log('Permissions already exist, fetching...');
          return Permission.find();
        }
        throw err;
      }
    );

    const permissionsMap = new Map();
    const allPermissions = await Permission.find();
    allPermissions.forEach((perm) => {
      permissionsMap.set(perm.name, perm._id);
    });

    console.log(`Created/Found ${allPermissions.length} permissions`);

    // Create roles
    console.log('Creating roles...');
    for (const roleData of defaultRoles) {
      const permissionIds = roleData.permissionNames.map((name) => permissionsMap.get(name)).filter(Boolean);

      const existingRole = await Role.findOne({ name: roleData.name });
      if (existingRole) {
        console.log(`Role '${roleData.displayName}' already exists`);
        continue;
      }

      const role = new Role({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: permissionIds,
        isSystem: roleData.isSystem,
      });

      await role.save();
      console.log(`Created role: ${roleData.displayName}`);
    }

    console.log('✓ Roles and permissions initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing roles and permissions:', error);
    process.exit(1);
  }
};

initializeRolesPermissions();
