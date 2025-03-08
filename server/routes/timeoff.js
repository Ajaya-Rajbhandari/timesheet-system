const express = require('express');
const router = express.Router();
const { auth, isManagerOrAdmin, isSelfOrHigherRole } = require('../middleware/auth');
const TimeOff = require('../models/TimeOff');
const User = require('../models/User');

/**
 * @route   POST api/timeoff
 * @desc    Create a new time-off request
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      reason,
      attachments
    } = req.body;

    // Create new time-off request
    const timeOff = new TimeOff({
      user: req.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      attachments: attachments || []
    });

    await timeOff.save();

    res.json(timeOff);
  } catch (err) {
    console.error('Create time-off request error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/timeoff
 * @desc    Get all time-off requests (for admin/manager)
 * @access  Private (Admin/Manager)
 */
router.get('/', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ];
    }
    
    const timeOffRequests = await TimeOff.find(query)
      .populate('user', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(timeOffRequests);
  } catch (err) {
    console.error('Get time-off requests error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/timeoff/my-requests
 * @desc    Get current user's time-off requests
 * @access  Private
 */
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { status, year } = req.query;
    
    let query = { user: req.user.id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 0);
      
      query.$or = [
        {
          startDate: { $gte: startOfYear, $lte: endOfYear }
        },
        {
          endDate: { $gte: startOfYear, $lte: endOfYear }
        }
      ];
    }
    
    const timeOffRequests = await TimeOff.find(query)
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(timeOffRequests);
  } catch (err) {
    console.error('Get my time-off requests error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/timeoff/:id
 * @desc    Get time-off request by ID
 * @access  Private (Self/Admin/Manager)
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const timeOff = await TimeOff.findById(req.params.id)
      .populate('user', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .populate('comments.user', 'firstName lastName');
    
    if (!timeOff) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    // Check if user has permission to view this request
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      timeOff.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }
    
    res.json(timeOff);
  } catch (err) {
    console.error('Get time-off request error:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/timeoff/:id
 * @desc    Update time-off request (only if pending)
 * @access  Private (Self only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      reason,
      attachments
    } = req.body;
    
    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);
    
    if (!timeOff) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    // Check if user is the owner of the request
    if (timeOff.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Check if request is still pending
    if (timeOff.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update request that is not pending' });
    }
    
    // Build time-off object
    const timeOffFields = {};
    if (type) timeOffFields.type = type;
    if (startDate) timeOffFields.startDate = new Date(startDate);
    if (endDate) timeOffFields.endDate = new Date(endDate);
    if (reason) timeOffFields.reason = reason;
    if (attachments) timeOffFields.attachments = attachments;
    
    // Update time-off request
    timeOff = await TimeOff.findByIdAndUpdate(
      req.params.id,
      { $set: timeOffFields },
      { new: true }
    ).populate('user', 'firstName lastName');
    
    res.json(timeOff);
  } catch (err) {
    console.error('Update time-off request error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/timeoff/:id/status
 * @desc    Update time-off request status (approve/reject)
 * @access  Private (Admin/Manager)
 */
router.put('/:id/status', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);
    
    if (!timeOff) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    // Check if request is pending
    if (timeOff.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }
    
    // Update status
    timeOff.status = status;
    timeOff.approvedBy = req.user.id;
    timeOff.approvalDate = Date.now();
    
    // Add comment if provided
    if (comment) {
      timeOff.comments.push({
        user: req.user.id,
        text: comment
      });
    }
    
    await timeOff.save();
    
    // Populate user and approver details
    timeOff = await TimeOff.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');
    
    res.json(timeOff);
  } catch (err) {
    console.error('Update time-off status error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/timeoff/:id/cancel
 * @desc    Cancel time-off request
 * @access  Private (Self only)
 */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);
    
    if (!timeOff) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    // Check if user is the owner of the request
    if (timeOff.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    
    // Check if request can be cancelled
    if (timeOff.status !== 'pending' && timeOff.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot cancel request with current status' });
    }
    
    // Update status
    timeOff.status = 'cancelled';
    
    await timeOff.save();
    
    res.json(timeOff);
  } catch (err) {
    console.error('Cancel time-off request error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/timeoff/:id/comment
 * @desc    Add comment to time-off request
 * @access  Private (Self/Admin/Manager)
 */
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);
    
    if (!timeOff) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }
    
    // Check if user has permission
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      timeOff.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to comment on this request' });
    }
    
    // Add comment
    timeOff.comments.push({
      user: req.user.id,
      text
    });
    
    await timeOff.save();
    
    // Populate user details for comments
    timeOff = await TimeOff.findById(req.params.id)
      .populate('comments.user', 'firstName lastName');
    
    res.json(timeOff.comments);
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/timeoff/user/:userId
 * @desc    Get time-off requests for a specific user
 * @access  Private (Self/Admin/Manager)
 */
router.get('/user/:userId', auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const { status, year } = req.query;
    
    let query = { user: req.params.userId };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 0);
      
      query.$or = [
        {
          startDate: { $gte: startOfYear, $lte: endOfYear }
        },
        {
          endDate: { $gte: startOfYear, $lte: endOfYear }
        }
      ];
    }
    
    const timeOffRequests = await TimeOff.find(query)
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(timeOffRequests);
  } catch (err) {
    console.error('Get user time-off requests error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
