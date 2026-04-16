# Role and Permission System Documentation

This document explains how to use the role-based access control (RBAC) system implemented in the Inyange Apps backend, similar to Laravel Spatie's model.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [API Endpoints](#api-endpoints)
5. [Backend Usage](#backend-usage)
6. [Best Practices](#best-practices)

## Overview

The system implements a flexible role and permission management system with:
- **Permissions**: Granular actions that can be performed (e.g., `travel.create`, `fuel.approve`)
- **Roles**: Collections of permissions grouped together (e.g., `admin`, `manager`, `finance`)
- **Users**: Assigned one or more roles to control their access

## Architecture

### Models

#### Permission Model
```javascript
{
  name: String,              // Unique identifier (e.g., 'travel.create')
  displayName: String,       // Human-readable name
  description: String,       // Optional description
  category: String,          // Category (travel, fuel, petty-cash, sales, gate-pass, users, reports, admin)
  createdAt: Date
}
```

#### Role Model
```javascript
{
  name: String,              // Unique identifier (e.g., 'admin', 'manager')
  displayName: String,       // Human-readable name
  description: String,       // Optional description
  permissions: [ObjectId],   // Array of Permission references
  isSystem: Boolean,         // System roles cannot be deleted
  createdAt: Date,
  updatedAt: Date
}
```

#### User Model (Updated)
```javascript
{
  // ... existing fields ...
  roles: [ObjectId],         // Array of Role references (NEW)
  role: String,              // Legacy field (kept for backward compatibility)
  permissions: Object        // Legacy field (kept for backward compatibility)
}
```

## Setup

### 1. Initialize Default Roles & Permissions

Run the seed script to create default roles and permissions:

```bash
node server/seeds/initializeRolesPermissions.js
```

This creates:
- **Default Roles**: Admin, Manager, Finance Officer, Employee
- **Default Permissions**: All CRUD and action permissions for each module

### 2. Verify Installation

Check that the routes are registered in your server:

```javascript
app.use('/api/roles-permissions', require('./routes/rolesPermissions'));
```

## API Endpoints

### Permission Management

#### Get All Permissions
```bash
GET /api/roles-permissions/permissions
Authorization: Bearer <token>
```
**Access**: Admin only
**Response**: Array of all permissions

#### Create Permission
```bash
POST /api/roles-permissions/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "custom.action",
  "displayName": "Custom Action",
  "description": "Custom permission description",
  "category": "admin"
}
```
**Access**: Admin only

#### Update Permission
```bash
PUT /api/roles-permissions/permissions/:id
Authorization: Bearer <token>

{
  "displayName": "Updated Name",
  "description": "Updated description",
  "category": "admin"
}
```
**Access**: Admin only

#### Delete Permission
```bash
DELETE /api/roles-permissions/permissions/:id
Authorization: Bearer <token>
```
**Access**: Admin only
**Note**: Automatically removes from all roles

### Role Management

#### Get All Roles
```bash
GET /api/roles-permissions/roles
Authorization: Bearer <token>
```
**Access**: Admin only

#### Create Role
```bash
POST /api/roles-permissions/roles
Authorization: Bearer <token>

{
  "name": "custom_role",
  "displayName": "Custom Role",
  "description": "Custom role description",
  "permissions": ["permission_id_1", "permission_id_2"]
}
```
**Access**: Admin only

#### Update Role
```bash
PUT /api/roles-permissions/roles/:id
Authorization: Bearer <token>

{
  "displayName": "Updated Role Name",
  "description": "Updated description",
  "permissions": ["permission_id_1", "permission_id_2"]
}
```
**Access**: Admin only
**Note**: Cannot modify system roles (isSystem: true)

#### Delete Role
```bash
DELETE /api/roles-permissions/roles/:id
Authorization: Bearer <token>
```
**Access**: Admin only
**Note**: Cannot delete system roles; automatically removes role from all users

#### Add Permission to Role
```bash
POST /api/roles-permissions/role/:roleId/add-permission
Authorization: Bearer <token>

{
  "permissionId": "permission_id"
}
```
**Access**: Admin only

#### Remove Permission from Role
```bash
POST /api/roles-permissions/role/:roleId/remove-permission
Authorization: Bearer <token>

{
  "permissionId": "permission_id"
}
```
**Access**: Admin only

### User Role Assignment

#### Assign Role to User
```bash
POST /api/roles-permissions/assign-role
Authorization: Bearer <token>

{
  "userId": "user_id",
  "roleId": "role_id"
}
```
**Access**: Admin only

#### Remove Role from User
```bash
POST /api/roles-permissions/remove-role
Authorization: Bearer <token>

{
  "userId": "user_id",
  "roleId": "role_id"
}
```
**Access**: Admin only

#### Sync User Roles (Replace All)
```bash
POST /api/roles-permissions/sync-user-roles
Authorization: Bearer <token>

{
  "userId": "user_id",
  "roleIds": ["role_id_1", "role_id_2"]
}
```
**Access**: Admin only
**Note**: Replaces all existing roles with the provided ones

#### Get User Roles
```bash
GET /api/roles-permissions/user/:userId/roles
Authorization: Bearer <token>
```

#### Get User Permissions (All from Roles)
```bash
GET /api/roles-permissions/user/:userId/permissions
Authorization: Bearer <token>
```

## Backend Usage

### In Route Handlers

#### Using Permission Middleware

```javascript
const { auth, hasPermission, hasAnyPermission, hasAllPermissions } = require('../middleware/auth');

// Check single permission
router.post('/travel', auth, hasPermission('travel.create'), async (req, res) => {
  // Only users with 'travel.create' permission can access
  // ...
});

// Check any of multiple permissions
router.get('/reports', auth, hasAnyPermission(['reports.view', 'reports.export']), async (req, res) => {
  // User must have at least one of these permissions
  // ...
});

// Check all permissions
router.delete('/travel/:id', auth, hasAllPermissions(['travel.delete', 'travel.edit']), async (req, res) => {
  // User must have all these permissions
  // ...
});
```

### In Controllers/Service Functions

```javascript
// Check if user has role
const hasAdminRole = await user.hasRole('admin');

// Check if user has permission
const canCreate = await user.hasPermission('travel.create');

// Check multiple permissions
const canManage = await user.hasPermission(['travel.create', 'travel.approve']);

// Get all permissions
const allPermissions = await user.getAllPermissions();
```

### Example Usage

```javascript
// Assign role to user
await axios.post('/api/roles-permissions/assign-role', {
  userId: 'user_id',
  roleId: 'manager_role_id'
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Assign multiple roles to user
await axios.post('/api/roles-permissions/sync-user-roles', {
  userId: 'user_id',
  roleIds: ['manager_role_id', 'finance_role_id']
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Remove role from user
await axios.post('/api/roles-permissions/remove-role', {
  userId: 'user_id',
  roleId: 'manager_role_id'
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Add permission to role
await axios.post('/api/roles-permissions/role/role_id/add-permission', {
  permissionId: 'permission_id'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Best Practices

### 1. Use Permission Names Consistently
```javascript
// Good - descriptive, category-based
'travel.create'
'travel.approve'
'petty-cash.mark_paid'

// Avoid - vague names
'create'
'edit'
'approve'
```

### 2. Organize by Categories
Group permissions by module/feature for better organization:
- `travel.*` - Travel requests
- `fuel.*` - Fuel requests
- `sales.*` - Sales orders
- `admin.*` - Administrative functions

### 3. Create Meaningful Roles
Don't create a role for every permission. Instead, group related permissions:
```javascript
// Admin role - full access
// Manager role - can create and approve
// Finance role - can mark paid/served
// Employee role - can only create and view
```

### 4. Use System Roles
Mark commonly used roles as system roles (isSystem: true):
- Cannot be deleted
- Cannot be modified (except permissions)
- Safer for critical access levels

### 5. Backward Compatibility
The system maintains backward compatibility with the legacy `role` field. You can use either:

```javascript
// Old way (still works)
if (user.role === 'administrator') { ... }

// New way (preferred)
if (await user.hasRole('admin')) { ... }
```

### 6. Audit Logging (Optional Enhancement)
Consider adding audit logs when assigning/removing roles:

```javascript
router.post('/assign-role', auth, isAdmin, async (req, res) => {
  // ... validation ...
  
  // Log the action
  await AuditLog.create({
    action: 'role_assigned',
    performedBy: req.user._id,
    targetUser: userId,
    role: roleId,
    timestamp: new Date()
  });
  
  // ... rest of handler ...
});
```

### 7. Permission Caching (For Performance)
For high-traffic applications, consider caching user permissions:

```javascript
// Cache user permissions in Redis
const cacheKey = `user:permissions:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const permissions = await user.getAllPermissions();
await redis.setex(cacheKey, 3600, JSON.stringify(permissions)); // Cache for 1 hour
```

## Migration from Legacy System

If you're currently using the legacy `role` and `permissions` fields:

1. Keep both systems running during migration (backward compatible)
2. Gradually assign roles to users:
   ```javascript
   const adminRole = await Role.findOne({ name: 'admin' });
   if (user.role === 'administrator') {
     user.roles.push(adminRole._id);
     await user.save();
   }
   ```
3. Once all users have roles assigned, you can deprecate the legacy fields
4. Update route handlers to use permission-based checks

## Troubleshooting

### User Can't Access Protected Route
1. Verify user has the required role: `GET /api/roles-permissions/user/:userId/roles`
2. Verify role has the permission: `GET /api/roles-permissions/roles/:roleId`
3. Check middleware order in route definition
4. Ensure token is valid and user is populated with roles

### Permissions Not Showing in User Data
Make sure to populate roles when fetching user:
```javascript
const user = await User.findById(userId).populate({
  path: 'roles',
  populate: { path: 'permissions' }
});
```

### Can't Delete System Role
System roles (isSystem: true) cannot be deleted. Create a new custom role instead or reassign users to a different role first.

---

**For more help, refer to the API endpoints section or check the route implementation in `server/routes/rolesPermissions.js`**
