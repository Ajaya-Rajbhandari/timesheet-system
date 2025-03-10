const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ShiftSwap = require('../models/ShiftSwap');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

/**
 * @route   POST api/shift-swaps/request
 * @desc    Request a shift swap
 * @access  Private
 */
router.post('/request', auth, async (req, res) => {
  try {
    const { targetUserId, requestingScheduleId, targetScheduleId, reason } = req.body;

    // Validate input
    if (!targetUserId || !requestingScheduleId || !targetScheduleId || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if schedules exist and belong to respective users
    const [requestingSchedule, targetSchedule, targetUser] = await Promise.all([
      Schedule.findById(requestingScheduleId),
      Schedule.findById(targetScheduleId),
      User.findById(targetUserId)
    ]);

    if (!requestingSchedule || !targetSchedule || !targetUser) {
      return res.status(404).json({ message: 'Schedule or user not found' });
    }

    if (requestingSchedule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to swap this schedule' });
    }

    if (targetSchedule.user.toString() !== targetUserId) {
      return res.status(403).json({ message: 'Target schedule does not belong to target user' });
    }

    // Create shift swap request
    const shiftSwap = new ShiftSwap({
      requestingUser: req.user.id,
      targetUser: targetUserId,
      requestingSchedule: requestingScheduleId,
      targetSchedule: targetScheduleId,
      reason
    });

    await shiftSwap.save();

    // Populate response data
    await shiftSwap.populate([
      { path: 'requestingUser', select: 'firstName lastName email' },
      { path: 'targetUser', select: 'firstName lastName email' },
      { path: 'requestingSchedule' },
      { path: 'targetSchedule' }
    ]);

    res.status(201).json(shiftSwap);
  } catch (err) {
    console.error('Shift swap request error:', err);
    res.status(500).json({ message: 'Server error while creating shift swap request' });
  }
});

/**
 * @route   GET api/shift-swaps
 * @desc    Get user's shift swaps (both requesting and target)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const swaps = await ShiftSwap.find({
      $or: [
        { requestingUser: req.user.id },
        { targetUser: req.user.id }
      ]
    })
    .sort({ requestDate: -1 })
    .populate([
      { path: 'requestingUser', select: 'firstName lastName email' },
      { path: 'targetUser', select: 'firstName lastName email' },
      { path: 'requestingSchedule' },
      { path: 'targetSchedule' }
    ]);

    res.json(swaps);
  } catch (err) {
    console.error('Get shift swaps error:', err);
    res.status(500).json({ message: 'Server error while fetching shift swaps' });
  }
});

/**
 * @route   PUT api/shift-swaps/:id/respond
 * @desc    Respond to a shift swap request
 * @access  Private
 */
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const swap = await ShiftSwap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Shift swap request not found' });
    }

    if (swap.targetUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    swap.status = status;
    swap.responseDate = Date.now();
    if (notes) swap.notes = notes;

    await swap.save();

    // If approved, update the schedules
    if (status === 'approved') {
      const [reqSchedule, targetSchedule] = await Promise.all([
        Schedule.findById(swap.requestingSchedule),
        Schedule.findById(swap.targetSchedule)
      ]);

      // Swap the users
      const tempUser = reqSchedule.user;
      reqSchedule.user = targetSchedule.user;
      targetSchedule.user = tempUser;

      await Promise.all([
        reqSchedule.save(),
        targetSchedule.save()
      ]);
    }

    await swap.populate([
      { path: 'requestingUser', select: 'firstName lastName email' },
      { path: 'targetUser', select: 'firstName lastName email' },
      { path: 'requestingSchedule' },
      { path: 'targetSchedule' }
    ]);

    res.json(swap);
  } catch (err) {
    console.error('Shift swap response error:', err);
    res.status(500).json({ message: 'Server error while processing shift swap response' });
  }
});

/**
 * @route   PUT api/shift-swaps/:id/manager-approval
 * @desc    Manager approval for shift swap
 * @access  Private
 */
router.put('/:id/manager-approval', auth, async (req, res) => {
  try {
    const { approved, notes } = req.body;

    // Verify user is a manager
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to approve this swap' });
    }

    const swap = await ShiftSwap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Shift swap request not found' });
    }

    // Check if the manager is in the same department as the users involved in the swap
    const [requestingUser, targetUser] = await Promise.all([
      User.findById(swap.requestingUser),
      User.findById(swap.targetUser)
    ]);

    if (!requestingUser || !targetUser) {
      return res.status(404).json({ message: 'Users involved in swap not found' });
    }

    // For admin, allow approval of any swap
    // For managers, only allow approval of swaps in their department
    if (req.user.role === 'manager' && 
        req.user.department.toString() !== requestingUser.department.toString() && 
        req.user.department.toString() !== targetUser.department.toString()) {
      return res.status(403).json({ message: 'Not authorized to approve swaps outside your department' });
    }

    if (swap.status !== 'approved') {
      return res.status(400).json({ message: 'This request must be approved before manager approval' });
    }

    if (swap.managerApproval) {
      return res.status(400).json({ message: 'This request has already been approved' });
    }

    // Create manager approval
    const managerApproval = {
      approved,
      approvedBy: req.user.id,
      approvalDate: Date.now()
    };

    if (notes) managerApproval.notes = notes;

    swap.managerApproval = managerApproval;
    swap.status = 'approved';
    swap.responseDate = Date.now();

    await swap.save();

    // If approved, update the schedules
    const [reqSchedule, targetSchedule] = await Promise.all([
      Schedule.findById(swap.requestingSchedule),
      Schedule.findById(swap.targetSchedule)
    ]);

    // Swap the users
    const tempUser = reqSchedule.user;
    reqSchedule.user = targetSchedule.user;
    targetSchedule.user = tempUser;

    await Promise.all([
      reqSchedule.save(),
      targetSchedule.save()
    ]);

    await swap.populate([
      { path: 'requestingUser', select: 'firstName lastName email' },
      { path: 'targetUser', select: 'firstName lastName email' },
      { path: 'requestingSchedule' },
      { path: 'targetSchedule' },
      { path: 'managerApproval.approvedBy', select: 'firstName lastName email' }
    ]);

    res.json(swap);
  } catch (err) {
    console.error('Shift swap manager approval error:', err);
    res.status(500).json({ message: 'Server error while processing shift swap manager approval' });
  }
});

/**
 * @route   GET api/shift-swaps/department/:departmentId
 * @desc    Get department shift swaps (manager only)
 * @access  Private
 */
router.get('/department/:departmentId', auth, async (req, res) => {
  try {
    // Verify user is a manager or admin
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view department swaps' });
    }

    // Get all swaps where either the requesting or target user is in the department
    const departmentUsers = await User.find({ department: req.params.departmentId });
    const userIds = departmentUsers.map(user => user._id);

    const swaps = await ShiftSwap.find({
      $or: [
        { requestingUser: { $in: userIds } },
        { targetUser: { $in: userIds } }
      ]
    })
    .sort({ requestDate: -1 })
    .populate([
      { path: 'requestingUser', select: 'firstName lastName email department' },
      { path: 'targetUser', select: 'firstName lastName email department' },
      { path: 'requestingSchedule' },
      { path: 'targetSchedule' }
    ]);

    res.json(swaps);
  } catch (err) {
    console.error('Get department shift swaps error:', err);
    res.status(500).json({ message: 'Server error while fetching department shift swaps' });
  }
});

module.exports = router; 