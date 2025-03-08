const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  }
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  breaks: [breakSchema],
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  ipAddress: {
    type: String
  },
  device: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
AttendanceSchema.index({ user: 1, clockIn: -1 });
AttendanceSchema.index({ location: '2dsphere' });

// Virtual for total work hours
AttendanceSchema.virtual('totalWorkHours').get(function() {
  if (!this.clockOut) return 0;
  
  let totalMs = this.clockOut - this.clockIn;
  
  // Subtract break times
  this.breaks.forEach(breakPeriod => {
    if (breakPeriod.endTime) {
      totalMs -= (breakPeriod.endTime - breakPeriod.startTime);
    }
  });
  
  return totalMs / (1000 * 60 * 60); // Convert to hours
});

// Virtual for total break time
AttendanceSchema.virtual('totalBreakTime').get(function() {
  let totalMs = 0;
  
  this.breaks.forEach(breakPeriod => {
    if (breakPeriod.endTime) {
      totalMs += (breakPeriod.endTime - breakPeriod.startTime);
    }
  });
  
  return totalMs / (1000 * 60); // Convert to minutes
});

// Virtual to check if currently on break
AttendanceSchema.virtual('isOnBreak').get(function() {
  if (!this.breaks.length) return false;
  const lastBreak = this.breaks[this.breaks.length - 1];
  return !lastBreak.endTime;
});

// Configure virtuals
AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
