const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  action: {
    type: String,
    enum: {
      values: ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'other'],
      message: '{VALUE} is not a valid action'
    },
    required: [true, 'Action is required']
  },
  entityType: {
    type: String,
    enum: {
      values: ['user', 'attendance', 'schedule', 'timeoff', 'department', 'system'],
      message: '{VALUE} is not a valid entity type'
    },
    required: [true, 'Entity type is required']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required']
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  ipAddress: String,
  userAgent: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: {
      values: ['success', 'failure', 'pending', 'error'],
      message: '{VALUE} is not a valid status'
    },
    default: 'success'
  },
  errorDetails: {
    message: String,
    stack: String,
    code: String
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, status: 1 });
AuditLogSchema.index({ department: 1, createdAt: -1 });

// Static method to create audit log entry
AuditLogSchema.statics.logAction = async function(params) {
  try {
    const {
      user,
      action,
      entityType,
      entityId,
      changes,
      description,
      ipAddress,
      userAgent,
      metadata,
      status,
      errorDetails,
      department
    } = params;

    const log = new this({
      user,
      action,
      entityType,
      entityId,
      changes,
      description,
      ipAddress,
      userAgent,
      metadata,
      status,
      errorDetails,
      department
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Create error log entry
    await new this({
      user: params.user,
      action: 'error',
      entityType: 'system',
      entityId: mongoose.Types.ObjectId(),
      description: 'Failed to create audit log',
      status: 'error',
      errorDetails: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    }).save();
  }
};

// Static method to get audit trail for an entity
AuditLogSchema.statics.getAuditTrail = async function(entityType, entityId, options = {}) {
  const {
    startDate,
    endDate,
    actions,
    status,
    limit = 100,
    skip = 0
  } = options;

  const query = { entityType, entityId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (actions) query.action = { $in: Array.isArray(actions) ? actions : [actions] };
  if (status) query.status = status;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email')
    .populate('department', 'name');
};

// Method to anonymize sensitive data
AuditLogSchema.methods.anonymize = function() {
  if (this.changes) {
    const sensitiveFields = ['password', 'token', 'ssn', 'creditCard'];
    
    if (this.changes.before) {
      sensitiveFields.forEach(field => {
        if (this.changes.before[field]) {
          this.changes.before[field] = '********';
        }
      });
    }
    
    if (this.changes.after) {
      sensitiveFields.forEach(field => {
        if (this.changes.after[field]) {
          this.changes.after[field] = '********';
        }
      });
    }
  }
  
  if (this.metadata) {
    const sensitiveMetadata = ['password', 'token', 'ssn', 'creditCard'];
    sensitiveMetadata.forEach(field => {
      if (this.metadata.get(field)) {
        this.metadata.set(field, '********');
      }
    });
  }
  
  return this;
};

module.exports = mongoose.model('AuditLog', AuditLogSchema); 