const express = require('express');
const router = express.Router();
const { auth, isManagerOrAdmin, isSelfOrHigherRole } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

/**
 * @route   POST /api/attendance/clock-in
 * @desc    Clock in
 * @access  Private
 */
router.post('/clock-in', auth, async (req, res) => {
  try {
    // Check if already clocked in today
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    let attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      clockOut: null  // Only check for active (not clocked out) sessions
    });

    if (attendance) {
      return res.status(400).json({ message: 'Already clocked in' });
    }

    // Create new attendance record
    attendance = new Attendance({
      user: req.user.id,
      clockIn: new Date(),
      breaks: []
    });

    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error('Clock in error:', err);
    res.status(500).json({ message: 'Server error during clock in' });
  }
});

/**
 * @route   PUT /api/attendance/clock-out
 * @desc    Clock out
 * @access  Private
 */
router.put('/clock-out', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      clockOut: null
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active attendance found' });
    }

    if (attendance.isOnBreak) {
      return res.status(400).json({ message: 'Please end your break before clocking out' });
    }

    attendance.clockOut = new Date();
    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error('Clock out error:', err);
    res.status(500).json({ message: 'Server error during clock out' });
  }
});

/**
 * @route   POST /api/attendance/break/start
 * @desc    Start break
 * @access  Private
 */
router.post('/break/start', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      clockOut: null
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active attendance found' });
    }

    if (attendance.isOnBreak) {
      return res.status(400).json({ message: 'Already on break' });
    }

    attendance.breaks.push({
      startTime: new Date()
    });

    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error('Start break error:', err);
    res.status(500).json({ message: 'Server error during break start' });
  }
});

/**
 * @route   PUT /api/attendance/break/end
 * @desc    End break
 * @access  Private
 */
router.put('/break/end', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      clockOut: null
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active attendance found' });
    }

    if (!attendance.isOnBreak) {
      return res.status(400).json({ message: 'Not on break' });
    }

    const currentBreak = attendance.breaks[attendance.breaks.length - 1];
    currentBreak.endTime = new Date();

    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error('End break error:', err);
    res.status(500).json({ message: 'Server error during break end' });
  }
});

/**
 * @route   GET /api/attendance/current
 * @desc    Get current attendance status
 * @access  Private
 */
router.get('/current', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      clockOut: null  // Only consider active sessions
    });

    if (!attendance) {
      return res.json({
        isClockedIn: false,
        isClockedOut: false,
        isOnBreak: false
      });
    }

    res.json({
      isClockedIn: true,
      isClockedOut: false,
      isOnBreak: attendance.isOnBreak,
      clockIn: attendance.clockIn,
      clockOut: null,
      breaks: attendance.breaks
    });
  } catch (err) {
    console.error('Get current status error:', err);
    res.status(500).json({ message: 'Server error getting current status' });
  }
});

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };
    
    if (startDate && endDate) {
      query.clockIn = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ clockIn: -1 });

    res.json(attendance);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ message: 'Server error getting attendance history' });
  }
});

/**
 * @route   GET /api/attendance/user/:userId
 * @desc    Get user attendance (admin/manager only)
 * @access  Private (Admin/Manager)
 */
router.get('/user/:userId', [auth, isManagerOrAdmin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.params.userId };
    
    if (startDate && endDate) {
      query.clockIn = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ clockIn: -1 });

    res.json(attendance);
  } catch (err) {
    console.error('Get user attendance error:', err);
    res.status(500).json({ message: 'Server error getting user attendance' });
  }
});

/**
 * @route   POST api/attendance/manual
 * @desc    Create manual attendance entry
 * @access  Private (Admin/Manager)
 */
router.post('/manual', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const {
      userId,
      date,
      clockInTime,
      clockOutTime,
      breaks,
      status,
      notes
    } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if attendance already exists for that day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: attendanceDate,
        $lt: nextDay
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this date' });
    }
    
    // Create new attendance record
    const attendance = new Attendance({
      user: userId,
      date: attendanceDate,
      clockInTime: new Date(clockInTime),
      clockOutTime: clockOutTime ? new Date(clockOutTime) : null,
      breaks: breaks || [],
      status: status || 'present',
      notes,
      isManualEntry: true,
      modifiedBy: req.user.id
    });
    
    await attendance.save();
    
    res.json(attendance);
  } catch (err) {
    console.error('Manual attendance entry error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/attendance/:id
 * @desc    Update attendance record
 * @access  Private (Admin/Manager)
 */
router.put('/:id', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const {
      clockInTime,
      clockOutTime,
      breaks,
      status,
      notes,
      totalWorkHours,
      totalBreakHours,
      overtime
    } = req.body;
    
    // Find attendance record
    let attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Update fields
    if (clockInTime) attendance.clockInTime = new Date(clockInTime);
    if (clockOutTime) attendance.clockOutTime = new Date(clockOutTime);
    if (breaks) attendance.breaks = breaks;
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;
    if (totalWorkHours) attendance.totalWorkHours = totalWorkHours;
    if (totalBreakHours) attendance.totalBreakHours = totalBreakHours;
    if (overtime) attendance.overtime = overtime;
    
    attendance.isManualEntry = true;
    attendance.modifiedBy = req.user.id;
    
    await attendance.save();
    
    res.json(attendance);
  } catch (err) {
    console.error('Update attendance error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/attendance/:id
 * @desc    Delete attendance record
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, isManagerOrAdmin, async (req, res) => {
  try {
    // Find attendance record
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    await Attendance.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Attendance record removed' });
  } catch (err) {
    console.error('Delete attendance error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
