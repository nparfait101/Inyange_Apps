const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    enum: ['Finance', 'Technical', 'Production', 'Quality', 'HR', 'IT', 'Commercial', 'MD\'office', 'Inventory'],
  },
  position: {
    type: String,
    required: true,
  },
  // Legacy role field - kept for backward compatibility
  role: {
    type: String,
    enum: ['user', 'administrator'],
    default: 'user',
  },
  // New roles system - array of role references
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
  ],
  // Legacy permissions - kept for backward compatibility
  permissions: {
    canMarkPaid: {
      type: Boolean,
      default: false,
    },
    canMarkServed: {
      type: Boolean,
      default: false,
    },
    canAccessSales: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a specific role
userSchema.methods.hasRole = async function (roleNames) {
  await this.populate('roles');
  const userRoles = this.roles.map(role => role.name);
  
  if (Array.isArray(roleNames)) {
    return roleNames.some(roleName => userRoles.includes(roleName));
  }
  return userRoles.includes(roleNames);
};

// Method to check if user has a specific permission
userSchema.methods.hasPermission = async function (permissionNames) {
  await this.populate({
    path: 'roles',
    populate: { path: 'permissions' },
  });
  
  const userPermissions = this.roles
    .flatMap(role => role.permissions)
    .map(permission => permission.name);
  
  if (Array.isArray(permissionNames)) {
    return permissionNames.some(permName => userPermissions.includes(permName));
  }
  return userPermissions.includes(permissionNames);
};

// Method to get all permissions from all roles
userSchema.methods.getAllPermissions = async function () {
  await this.populate({
    path: 'roles',
    populate: { path: 'permissions' },
  });
  
  const permissions = this.roles
    .flatMap(role => role.permissions)
    .filter((perm, index, self) => index === self.findIndex(p => p._id.equals(perm._id)));
  
  return permissions;
};

module.exports = mongoose.model('User', userSchema);
