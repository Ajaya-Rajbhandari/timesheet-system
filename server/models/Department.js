const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters'],
    maxlength: [50, 'Department name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Department code must be at least 2 characters'],
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  budget: {
    fiscal_year: Number,
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  location: {
    building: String,
    floor: String,
    room: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  defaultWorkingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
DepartmentSchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual for sub-departments
DepartmentSchema.virtual('subDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Index for faster queries
DepartmentSchema.index({ name: 1, code: 1 });
DepartmentSchema.index({ parentDepartment: 1 });
DepartmentSchema.index({ manager: 1 });

// Pre-save middleware to ensure manager exists and has appropriate role
DepartmentSchema.pre('save', async function(next) {
  if (this.isModified('manager') && this.manager) {
    try {
      const User = mongoose.model('User');
      const manager = await User.findById(this.manager);
      
      if (!manager) {
        throw new Error('Manager not found');
      }
      
      if (!['admin', 'manager'].includes(manager.role)) {
        throw new Error('Department manager must have manager or admin role');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Method to get department hierarchy
DepartmentSchema.methods.getHierarchy = async function() {
  const hierarchy = [this];
  let current = this;
  
  while (current.parentDepartment) {
    current = await this.model('Department').findById(current.parentDepartment);
    if (current) {
      hierarchy.unshift(current);
    } else {
      break;
    }
  }
  
  return hierarchy;
};

// Static method to get all departments with their sub-departments
DepartmentSchema.statics.getDepartmentTree = async function() {
  return await this.find({ parentDepartment: null })
    .populate({
      path: 'subDepartments',
      populate: { path: 'subDepartments' }
    })
    .populate('manager', 'firstName lastName email');
};

module.exports = mongoose.model('Department', DepartmentSchema); 