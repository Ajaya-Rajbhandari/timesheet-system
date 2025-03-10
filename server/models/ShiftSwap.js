const mongoose = require('mongoose');

const ShiftSwapSchema = new mongoose.Schema({
  requestingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requesting user is required']
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target user is required']
  },
  requestingSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Requesting schedule is required']
  },
  targetSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Target schedule is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  managerApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,
    notes: String
  },
  reason: {
    type: String,
    required: [true, 'Reason for swap is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ShiftSwapSchema.index({ requestingUser: 1, status: 1 });
ShiftSwapSchema.index({ targetUser: 1, status: 1 });
ShiftSwapSchema.index({ status: 1, requestDate: -1 });

// Virtual for checking if swap is still valid
ShiftSwapSchema.virtual('isValid').get(function() {
  const now = new Date();
  const requestingSchedule = this.requestingSchedule;
  const targetSchedule = this.targetSchedule;
  
  return (
    this.status === 'pending' &&
    requestingSchedule.startDate > now &&
    targetSchedule.startDate > now
  );
});

// Pre-save middleware to validate schedules
ShiftSwapSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'approved') {
    // Ensure both schedules are still valid
    const Schedule = mongoose.model('Schedule');
    const [reqSchedule, targetSchedule] = await Promise.all([
      Schedule.findById(this.requestingSchedule),
      Schedule.findById(this.targetSchedule)
    ]);

    if (!reqSchedule || !targetSchedule) {
      throw new Error('One or both schedules no longer exist');
    }

    if (reqSchedule.startDate <= new Date() || targetSchedule.startDate <= new Date()) {
      throw new Error('Cannot swap past or current schedules');
    }
  }
  next();
});

module.exports = mongoose.model('ShiftSwap', ShiftSwapSchema); 