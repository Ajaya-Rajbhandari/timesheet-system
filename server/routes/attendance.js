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
    // First, close any active sessions for this user
    await Attendance.updateMany(
      {
        user: req.user.id,
        clockOut: null
      },
      {
        $set: {
          clockOut: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create new attendance record
    const attendance = new Attendance({
      user: req.user.id,
      clockIn: new Date(),
      breaks: []
    });

    await attendance.save();
    
    // Send back the full attendance object
    const fullAttendance = await attendance.populate('user', 'firstName lastName');
    
    return res.json({
      clockIn: fullAttendance.clockIn,
      clockOut: fullAttendance.clockOut,
      breaks: fullAttendance.breaks,
      user: {
        id: fullAttendance.user._id,
        name: `${fullAttendance.user.firstName} ${fullAttendance.user.lastName}`
      }
    });
  } catch (err) {
    console.error('Clock in error:', err.message);
    return res.status(500).json({ message: 'Server error during clock in' });
  }
});

/**
 * @route   PUT /api/attendance/clock-out
 * @desc    Clock out
 * @access  Private
 */
router.put('/clock-out', auth, async (req, res) => {
  try {
    // Find the latest active attendance record
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockOut: null
    }).sort({ clockIn: -1 });

    if (!attendance) {
      return res.status(400).json({ message: 'No active attendance record found' });
    }

    // End any active breaks
    if (attendance.breaks?.length > 0) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = new Date();
      }
    }

    // Set clock out time
    attendance.clockOut = new Date();
    await attendance.save();

    // Send back the full attendance object
    const fullAttendance = await attendance.populate('user', 'firstName lastName');
    
    return res.json({
      clockIn: fullAttendance.clockIn,
      clockOut: fullAttendance.clockOut,
      breaks: fullAttendance.breaks,
      user: {
        id: fullAttendance.user._id,
        name: `${fullAttendance.user.firstName} ${fullAttendance.user.lastName}`
      }
    });
  } catch (err) {
    console.error('Clock out error:', err.message);
    return res.status(500).json({ message: 'Server error during clock out' });
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

    return res.json(attendance);
  } catch (err) {
    console.error('Start break error:', err.message);
    return res.status(500).json({ message: 'Server error during break start' });
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

    // End the last break
    const lastBreakIndex = attendance.breaks.length - 1;
    attendance.breaks[lastBreakIndex].endTime = new Date();

    await attendance.save();

    return res.json(attendance);
  } catch (err) {
    console.error('End break error:', err.message);
    return res.status(500).json({ message: 'Server error during break end' });
  }
});

/**
 * @route   GET /api/attendance/current
 * @desc    Get current attendance status
 * @access  Private
 */
router.get('/current', auth, async (req, res) => {
  try {
    // Get today's date
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');
    
    console.log(`Getting current status for user ${req.user.id} on ${today.format('YYYY-MM-DD')}`);
    
    // Find today's attendance record - get the most recent one
    const attendance = await Attendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      }
    }).sort({ clockIn: -1 });
    
    console.log('Found attendance record:', attendance ? attendance._id : 'None');
    
    // If no attendance record found for today, check if there's any active record from previous days
    let activeAttendance = attendance;
    if (!activeAttendance || activeAttendance.clockOut) {
      // Look for any active attendance (clocked in but not out) from previous days
      const activeFromPrevious = await Attendance.findOne({
        user: req.user.id,
        clockOut: null
      }).sort({ clockIn: -1 });
      
      if (activeFromPrevious) {
        console.log(`Found active attendance from previous day: ${activeFromPrevious._id}`);
        activeAttendance = activeFromPrevious;
      }
    }
    
    // Also get any active breaks
    const activeBreak = activeAttendance?.breaks?.find(b => !b.endTime);
    
    // Check if there's an active session (clocked in but not clocked out)
    const isActive = activeAttendance && !activeAttendance.clockOut;
    
    console.log(`User is clocked in: ${isActive}`);
    if (isActive) {
      console.log(`Clock in time: ${activeAttendance.clockIn}`);
    }
    
    const status = {
      isClockedIn: isActive,
      clockInTime: activeAttendance?.clockIn || null,
      clockOutTime: activeAttendance?.clockOut || null,
      onBreak: !!activeBreak,
      breakStartTime: activeBreak?.startTime || null,
      lastUpdated: new Date(),
      // Include the attendance ID for reference
      attendanceId: activeAttendance?._id || null,
      // Include total breaks information
      totalBreaks: activeAttendance?.breaks?.length || 0,
      // Include any additional useful information
      userId: req.user.id
    };
    
    console.log('Sending status to client:', JSON.stringify(status));
    return res.json(status);
  } catch (err) {
    console.error('Error getting current status:', err.message);
    return res.status(500).json({ message: 'Server error getting attendance status' });
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

    return res.json(attendance);
  } catch (err) {
    console.error('Get history error:', err.message);
    return res.status(500).json({ message: 'Server error getting attendance history' });
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

    return res.json(attendance);
  } catch (err) {
    console.error('Get user attendance error:', err.message);
    return res.status(500).json({ message: 'Server error getting user attendance' });
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
    
    return res.json(attendance);
  } catch (err) {
    console.error('Manual attendance entry error:', err);
    return res.status(500).json({ message: 'Server error' });
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
    
    return res.json(attendance);
  } catch (err) {
    console.error('Update attendance error:', err);
    return res.status(500).json({ message: 'Server error' });
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
    
    return res.json({ message: 'Attendance record removed' });
  } catch (err) {
    console.error('Delete attendance error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/attendance/auto-clockout
 * @desc    Record an auto clock-out
 * @access  Private
 */
router.post('/auto-clockout', auth, async (req, res) => {
  try {
    const { date, clockIn, clockOut, notes } = req.body;
    
    // Find the attendance record
    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: moment(date).startOf('day').toDate()
    });
    
    if (!attendance) {
      // Create a new attendance record
      const newAttendance = new Attendance({
        user: req.user.id,
        date: moment(date).startOf('day').toDate(),
        clockIn: clockIn,
        clockOut: clockOut,
        status: 'Auto-completed',
        notes: notes || 'System auto clock-out at end of day'
      });
      
      await newAttendance.save();
      return res.status(201).json(newAttendance);
    }
    
    // Update the existing attendance record
    attendance.clockOut = clockOut;
    attendance.status = 'Auto-completed';
    attendance.notes = notes || 'System auto clock-out at end of day';
    
    await attendance.save();
    return res.json(attendance);
  } catch (err) {
    console.error('Error recording auto clock-out:', err.message);
    return res.status(500).json({ message: 'Server error while recording auto clock-out' });
  }
});

module.exports = router;
