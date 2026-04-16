# Role & Permission System - Quick Reference

## Quick Setup

```bash
# 1. Initialize default roles & permissions
node server/seeds/initializeRolesPermissions.js

# 2. Server automatically loads routes at /api/roles-permissions
```

## Common Commands (API Examples)

### Assign Role to User
```bash
curl -X POST http://localhost:5000/api/roles-permissions/assign-role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "roleId": "ROLE_ID"}'
```

### Remove Role from User
```bash
curl -X POST http://localhost:5000/api/roles-permissions/remove-role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "roleId": "ROLE_ID"}'
```

### Get All Roles
```bash
curl -X GET http://localhost:5000/api/roles-permissions/roles \
  -H "Authorization: Bearer <token>"
```

### Create New Role
```bash
curl -X POST http://localhost:5000/api/roles-permissions/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_role",
    "displayName": "Custom Role",
    "description": "Description here",
    "permissions": ["PERM_ID_1", "PERM_ID_2"]
  }'
```

### Add Permission to Role
```bash
curl -X POST http://localhost:5000/api/roles-permissions/role/ROLE_ID/add-permission \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionId": "PERM_ID"}'
```

### Get User's Roles
```bash
curl -X GET http://localhost:5000/api/roles-permissions/user/USER_ID/roles \
  -H "Authorization: Bearer <token>"
```

### Get User's Permissions
```bash
curl -X GET http://localhost:5000/api/roles-permissions/user/USER_ID/permissions \
  -H "Authorization: Bearer <token>"
```

## Default Roles Included

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | All permissions | Full system access |
| **manager** | Create, view, approve | Manage requests and approvals |
| **finance** | View, mark paid/served | Financial operations |
| **employee** | Create, view | Basic user access |

## In Code Examples

### Protect Route with Permission
```javascript
const { auth, hasPermission } = require('../middleware/auth');

// Only users with 'travel.create' permission can POST
router.post('/travel', auth, hasPermission('travel.create'), (req, res) => {
  // ...
});
```

### Check Multiple Permissions
```javascript
const { hasAnyPermission } = require('../middleware/auth');

// User needs at least one permission
router.get('/reports', auth, hasAnyPermission(['reports.view', 'reports.export']), (req, res) => {
  // ...
});
```

### Check User Permission in Code
```javascript
// Check single permission
const canCreate = await user.hasPermission('travel.create');

// Check multiple
const canManage = await user.hasPermission(['travel.create', 'travel.approve']);

// Check role
const isAdmin = await user.hasRole('admin');

// Get all permissions
const allPerms = await user.getAllPermissions();
```

## Permission Naming Convention

```
MODULE.ACTION

Examples:
- travel.create      (create travel request)
- travel.approve     (approve travel)
- fuel.view          (view fuel requests)
- sales.mark_served  (mark sales as served)
- admin.manage_roles (manage roles)
```

## Modules Available

- `travel.*`      - Travel requests
- `fuel.*`        - Fuel requests
- `petty-cash.*`  - Petty cash requests
- `sales.*`       - Sales orders
- `gate-pass.*`   - Gate passes
- `users.*`       - User management
- `reports.*`     - Reporting
- `admin.*`       - Administrative

## Files Modified/Created

| File | Purpose |
|------|---------|
| `server/models/Permission.js` | Permission schema |
| `server/models/Role.js` | Role schema |
| `server/models/User.js` | Updated with roles support |
| `server/middleware/auth.js` | Enhanced auth with permission checking |
| `server/routes/rolesPermissions.js` | API endpoints for roles/permissions |
| `server/seeds/initializeRolesPermissions.js` | Initialize default data |
| `ROLES_PERMISSIONS_GUIDE.md` | Full documentation |
| `ROLES_PERMISSIONS_CHEATSHEET.md` | This file |

## Next Steps

1. ✅ Run initialization script
2. ✅ Test assign/remove role endpoints
3. ✅ Update existing routes to use permission checks
4. ✅ Create admin UI for role management (optional)
5. ✅ Migrate existing users to new role system

## Need More Help?

See `ROLES_PERMISSIONS_GUIDE.md` for detailed documentation
