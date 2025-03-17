const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Add schema definition
const TimeOffSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['vacation', 'sick', 'personal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create index after schema definition
TimeOffSchema.index({ user: 1, startDate: -1 });

// Export the model
module.exports = mongoose.model('TimeOff', TimeOffSchema);
