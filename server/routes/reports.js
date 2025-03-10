const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const TimeOff = require('../models/TimeOff');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');
const reportController = require('../controllers/reportController');
const moment = require('moment');

// @route   GET api/reports/attendance-summary
// @desc    Get attendance summary report
// @access  Private (Admin/Manager)
router.get('/attendance-summary', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Build query
    const query = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    // Add department filter if provided
    if (department) {
      // First find users in the department
      const departmentUsers = await User.find({ department }).select('_id');
      const userIds = departmentUsers.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate attendance data
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          totalDays: { $sum: 1 },
          totalWorkHours: { $sum: '$totalWorkHours' },
          totalBreakHours: { $sum: '$totalBreakTime' },
          onTimeCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'on-time'] }, 1, 0] 
            } 
          },
          lateCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0] 
            } 
          },
          earlyDepartureCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'early-departure'] }, 1, 0] 
            } 
          },
          absentCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] 
            } 
          },
          overtimeHours: { $sum: '$overtimeHours' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          department: '$userDetails.department',
          position: '$userDetails.position',
          totalDays: 1,
          totalWorkHours: 1,
          totalBreakHours: 1,
          onTimeCount: 1,
          lateCount: 1,
          earlyDepartureCount: 1,
          absentCount: 1,
          overtimeHours: 1,
          attendanceRate: { 
            $multiply: [
              { $divide: ['$onTimeCount', { $add: ['$totalDays', 0.001] }] }, 
              100
            ] 
          }
        }
      },
      { $sort: { 'lastName': 1, 'firstName': 1 } }
    ]);

    res.json(attendanceSummary);
  } catch (err) {
    console.error('Error generating attendance summary report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/overtime
// @desc    Get overtime report
// @access  Private (Admin/Manager)
router.get('/overtime', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Build query
    const query = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      overtimeHours: { $gt: 0 }  // Only include records with overtime
    };

    // Add department filter if provided
    if (department) {
      // First find users in the department
      const departmentUsers = await User.find({ department }).select('_id');
      const userIds = departmentUsers.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate overtime data
    const overtimeReport = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          totalOvertimeHours: { $sum: '$overtimeHours' },
          overtimeDays: { $sum: 1 },
          overtimeRecords: { 
            $push: { 
              date: '$date', 
              overtimeHours: '$overtimeHours',
              clockIn: '$clockIn',
              clockOut: '$clockOut'
            } 
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          department: '$userDetails.department',
          position: '$userDetails.position',
          totalOvertimeHours: 1,
          overtimeDays: 1,
          overtimeRecords: 1
        }
      },
      { $sort: { 'totalOvertimeHours': -1 } }
    ]);

    res.json(overtimeReport);
  } catch (err) {
    console.error('Error generating overtime report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/time-off
// @desc    Get time-off report
// @access  Private (Admin/Manager)
router.get('/time-off', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, department, type } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Build query
    const query = {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
      status: 'approved'  // Only include approved time-off
    };

    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    // Add department filter if provided
    let userIds = [];
    if (department) {
      // First find users in the department
      const departmentUsers = await User.find({ department }).select('_id');
      userIds = departmentUsers.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate time-off data
    const timeOffReport = await TimeOff.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          totalDays: { $sum: '$days' },
          timeOffRecords: { 
            $push: { 
              type: '$type', 
              startDate: '$startDate',
              endDate: '$endDate',
              days: '$days',
              reason: '$reason'
            } 
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          department: '$userDetails.department',
          position: '$userDetails.position',
          totalDays: 1,
          timeOffRecords: 1
        }
      },
      { $sort: { 'totalDays': -1 } }
    ]);

    // Calculate department totals if department filter is applied
    let departmentSummary = null;
    if (department) {
      const typeBreakdown = await TimeOff.aggregate([
        { 
          $match: { 
            ...query,
            user: { $in: userIds }
          } 
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDays: { $sum: '$days' }
          }
        }
      ]);
      
      departmentSummary = {
        department,
        totalEmployees: userIds.length,
        totalTimeOffDays: timeOffReport.reduce((sum, record) => sum + record.totalDays, 0),
        typeBreakdown
      };
    }

    res.json({
      timeOffRecords: timeOffReport,
      departmentSummary
    });
  } catch (err) {
    console.error('Error generating time-off report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/department-summary
// @desc    Get department summary report
// @access  Private (Admin/Manager)
router.get('/department-summary', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Build department query
    const departmentQuery = department ? { department } : {};

    // Get departments
    const departments = department 
      ? [department] 
      : await User.distinct('department');

    const departmentSummaries = [];

    // Process each department
    for (const dept of departments) {
      // Find users in the department
      const departmentUsers = await User.find({ department: dept }).select('_id');
      const userIds = departmentUsers.map(user => user._id);

      // Get attendance data
      const attendanceData = await Attendance.aggregate([
        { 
          $match: { 
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            user: { $in: userIds }
          } 
        },
        {
          $group: {
            _id: null,
            totalWorkHours: { $sum: '$totalWorkHours' },
            totalBreakHours: { $sum: '$totalBreakTime' },
            onTimeCount: { 
              $sum: { $cond: [{ $eq: ['$status', 'on-time'] }, 1, 0] } 
            },
            lateCount: { 
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } 
            },
            absentCount: { 
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } 
            },
            overtimeHours: { $sum: '$overtimeHours' }
          }
        }
      ]);

      // Get time-off data
      const timeOffData = await TimeOff.aggregate([
        { 
          $match: { 
            startDate: { $gte: new Date(startDate) },
            endDate: { $lte: new Date(endDate) },
            status: 'approved',
            user: { $in: userIds }
          } 
        },
        {
          $group: {
            _id: null,
            totalTimeOffDays: { $sum: '$days' },
            sickDays: { 
              $sum: { $cond: [{ $eq: ['$type', 'sick'] }, '$days', 0] } 
            },
            vacationDays: { 
              $sum: { $cond: [{ $eq: ['$type', 'vacation'] }, '$days', 0] } 
            },
            personalDays: { 
              $sum: { $cond: [{ $eq: ['$type', 'personal'] }, '$days', 0] } 
            }
          }
        }
      ]);

      departmentSummaries.push({
        department: dept,
        employeeCount: departmentUsers.length,
        attendance: attendanceData.length > 0 ? attendanceData[0] : {
          totalWorkHours: 0,
          totalBreakHours: 0,
          onTimeCount: 0,
          lateCount: 0,
          absentCount: 0,
          overtimeHours: 0
        },
        timeOff: timeOffData.length > 0 ? timeOffData[0] : {
          totalTimeOffDays: 0,
          sickDays: 0,
          vacationDays: 0,
          personalDays: 0
        }
      });
    }

    res.json(departmentSummaries);
  } catch (err) {
    console.error('Error generating department summary report:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/user-details/:userId
// @desc    Get detailed user report
// @access  Private (Admin/Manager/Self)
router.get('/user-details/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Check authorization
    if (req.user.id !== userId && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }

    // Get user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get attendance data
    const attendanceData = await Attendance.find({
      user: userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: 1 });

    // Get time-off data
    const timeOffData = await TimeOff.find({
      user: userId,
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) }
    }).sort({ startDate: 1 });

    // Get schedule data
    const scheduleData = await Schedule.find({
      user: userId,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    }).sort({ startDate: 1 });

    // Calculate summary statistics
    const totalWorkHours = attendanceData.reduce((sum, record) => sum + record.totalWorkHours, 0);
    const totalBreakHours = attendanceData.reduce((sum, record) => sum + record.totalBreakTime, 0);
    const totalOvertimeHours = attendanceData.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    
    const onTimeCount = attendanceData.filter(record => record.status === 'on-time').length;
    const lateCount = attendanceData.filter(record => record.status === 'late').length;
    const earlyDepartureCount = attendanceData.filter(record => record.status === 'early-departure').length;
    const absentCount = attendanceData.filter(record => record.status === 'absent').length;
    
    const totalTimeOffDays = timeOffData.reduce((sum, record) => sum + record.days, 0);
    const approvedTimeOffDays = timeOffData
      .filter(record => record.status === 'approved')
      .reduce((sum, record) => sum + record.days, 0);

    // Prepare the report
    const userReport = {
      userDetails: user,
      summary: {
        totalWorkDays: attendanceData.length,
        totalWorkHours,
        totalBreakHours,
        totalOvertimeHours,
        onTimeCount,
        lateCount,
        earlyDepartureCount,
        absentCount,
        attendanceRate: attendanceData.length > 0 
          ? (onTimeCount / attendanceData.length) * 100 
          : 0,
        totalTimeOffDays,
        approvedTimeOffDays
      },
      attendanceRecords: attendanceData,
      timeOffRecords: timeOffData,
      scheduleRecords: scheduleData
    };

    res.json(userReport);
  } catch (err) {
    console.error('Error generating user details report:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/reports/user-stats
 * @desc    Get stats for a specific user
 * @access  Private
 */
router.get('/user-stats', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    
    // Check if user has permission to view stats for this user
    if (userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Not authorized to view stats for this user.' });
    }
    
    // Get current month's date range
    const startDate = moment().startOf('month').toDate();
    const endDate = moment().endOf('month').toDate();
    
    // Get attendance records for the user
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate total hours worked
    let totalHours = 0;
    attendanceRecords.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const clockIn = moment(record.clockIn);
        const clockOut = moment(record.clockOut);
        const duration = moment.duration(clockOut.diff(clockIn));
        totalHours += duration.asHours();
      }
    });
    
    // Calculate attendance rate
    const workDays = getWorkDays(startDate, endDate);
    const attendedDays = new Set(attendanceRecords.map(record => 
      moment(record.date).format('YYYY-MM-DD')
    )).size;
    
    const attendanceRate = workDays > 0 ? Math.round((attendedDays / workDays) * 100) : 0;
    
    // Get schedule data
    const schedules = await Schedule.find({
      user: userId,
      startDate: { $gte: startDate, $lte: endDate }
    });
    
    // Get time off data
    const timeOffRequests = await TimeOff.find({
      user: userId,
      status: 'approved',
      startDate: { $gte: startDate }
    }).sort({ startDate: 1 });
    
    res.json({
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
      attendanceRate,
      scheduledDays: schedules.length,
      upcomingTimeOff: timeOffRequests.length
    });
  } catch (err) {
    console.error('Error getting user stats:', err);
    res.status(500).json({ message: 'Server error while fetching user stats' });
  }
});

// Helper function to get number of work days in a date range
function getWorkDays(startDate, endDate) {
  let count = 0;
  let current = moment(startDate);
  const end = moment(endDate);
  
  while (current.isSameOrBefore(end)) {
    // Check if it's a weekday (Monday to Friday)
    if (current.day() !== 0 && current.day() !== 6) {
      count++;
    }
    current.add(1, 'day');
  }
  
  return count;
}

// Get report data
router.get('/data', auth, reportController.getReportData);

// Generate specific type of report (summary/detailed)
router.get('/:type', auth, reportController.generateReport);

// Export report
router.get('/export', auth, reportController.exportReport);

module.exports = router;