const express = require("express");
const router = express.Router();
const {
  auth,
  canAccessReports,
  isManagerOrAdmin,
} = require("../middleware/auth");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const TimeOff = require("../models/TimeOff");
const Schedule = require("../models/Schedule");
const Department = require("../models/Department");
const mongoose = require("mongoose");
const reportController = require("../controllers/reportController");
const moment = require("moment");

// Middleware to check if user is admin or manager
const checkAdminManager = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isAdmin || user.isManager) {
      req.user.isAdmin = user.isAdmin;
      req.user.isManager = user.isManager;
      next();
    } else {
      res
        .status(403)
        .json({ message: "Access denied. Admin/Manager privileges required." });
    }
  } catch (err) {
    console.error("Error checking admin/manager status:", err);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/reports/attendance-summary
// @desc    Get attendance summary report
// @access  Private (Admin/Manager)
router.get("/attendance-summary", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build query
    const query = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    // Add department filter if provided
    if (department) {
      // Validate department ID
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      // Check if department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ message: "Department not found" });
      }

      // First find users in the department
      const departmentUsers = await User.find({ department }).select("_id");
      const userIds = departmentUsers.map((user) => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate attendance data
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user",
          totalDays: { $sum: 1 },
          totalWorkHours: { $sum: "$totalWorkHours" },
          totalBreakHours: { $sum: "$totalBreakTime" },
          onTimeCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "on-time"] }, 1, 0],
            },
          },
          lateCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "late"] }, 1, 0],
            },
          },
          earlyDepartureCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "early-departure"] }, 1, 0],
            },
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "absent"] }, 1, 0],
            },
          },
          overtimeHours: { $sum: "$overtimeHours" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          userId: "$_id",
          firstName: "$userDetails.firstName",
          lastName: "$userDetails.lastName",
          department: "$userDetails.department",
          position: "$userDetails.position",
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
              { $divide: ["$onTimeCount", { $add: ["$totalDays", 0.001] }] },
              100,
            ],
          },
        },
      },
      { $sort: { lastName: 1, firstName: 1 } },
    ]);

    res.json(attendanceSummary);
  } catch (err) {
    console.error("Error generating attendance summary report:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/reports/overtime
// @desc    Get overtime report
// @access  Private (Admin/Manager)
router.get("/overtime", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build query
    const query = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      overtimeHours: { $gt: 0 }, // Only include records with overtime
    };

    // Add department filter if provided
    if (department) {
      // Validate department ID
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      // Check if department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ message: "Department not found" });
      }

      // First find users in the department
      const departmentUsers = await User.find({ department }).select("_id");
      const userIds = departmentUsers.map((user) => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate overtime data
    const overtimeReport = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user",
          totalOvertimeHours: { $sum: "$overtimeHours" },
          overtimeDays: { $sum: 1 },
          overtimeRecords: {
            $push: {
              date: "$date",
              overtimeHours: "$overtimeHours",
              clockIn: "$clockIn",
              clockOut: "$clockOut",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          userId: "$_id",
          firstName: "$userDetails.firstName",
          lastName: "$userDetails.lastName",
          department: "$userDetails.department",
          position: "$userDetails.position",
          totalOvertimeHours: 1,
          overtimeDays: 1,
          overtimeRecords: 1,
        },
      },
      { $sort: { totalOvertimeHours: -1 } },
    ]);

    res.json(overtimeReport);
  } catch (err) {
    console.error("Error generating overtime report:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/reports/time-off
// @desc    Get time-off report
// @access  Private (Admin/Manager)
router.get("/time-off", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department, type } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build query
    const query = {
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
      status: "approved", // Only include approved time-off
    };

    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    // Add department filter if provided
    let userIds = [];
    if (department) {
      // Validate department ID
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      // Check if department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ message: "Department not found" });
      }

      // First find users in the department
      const departmentUsers = await User.find({ department }).select("_id");
      userIds = departmentUsers.map((user) => user._id);
      query.user = { $in: userIds };
    }

    // Aggregate time-off data
    const timeOffReport = await TimeOff.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$user",
          totalDays: { $sum: "$days" },
          timeOffRecords: {
            $push: {
              type: "$type",
              startDate: "$startDate",
              endDate: "$endDate",
              days: "$days",
              reason: "$reason",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          userId: "$_id",
          firstName: "$userDetails.firstName",
          lastName: "$userDetails.lastName",
          department: "$userDetails.department",
          position: "$userDetails.position",
          totalDays: 1,
          timeOffRecords: 1,
        },
      },
      { $sort: { totalDays: -1 } },
    ]);

    // Calculate department totals if department filter is applied
    let departmentSummary = null;
    if (department) {
      const typeBreakdown = await TimeOff.aggregate([
        {
          $match: {
            ...query,
            user: { $in: userIds },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalDays: { $sum: "$days" },
          },
        },
      ]);

      departmentSummary = {
        department: department,
        totalEmployees: userIds.length,
        totalTimeOffDays: timeOffReport.reduce(
          (sum, record) => sum + record.totalDays,
          0,
        ),
        typeBreakdown,
      };
    }

    res.json({
      timeOffRecords: timeOffReport,
      departmentSummary,
    });
  } catch (err) {
    console.error("Error generating time-off report:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/reports/department-summary
// @desc    Get department summary report
// @access  Private (Admin/Manager)
router.get("/department-summary", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build department query
    const departmentQuery = department ? { department } : {};

    // Get departments
    const departments = department
      ? [department]
      : await User.distinct("department");

    const departmentSummaries = [];

    // Process each department
    for (const dept of departments) {
      // Find users in the department
      const departmentUsers = await User.find({ department: dept }).select(
        "_id",
      );
      const userIds = departmentUsers.map((user) => user._id);

      // Get attendance data
      const attendanceData = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            user: { $in: userIds },
          },
        },
        {
          $group: {
            _id: null,
            totalWorkHours: { $sum: "$totalWorkHours" },
            totalBreakHours: { $sum: "$totalBreakTime" },
            onTimeCount: {
              $sum: { $cond: [{ $eq: ["$status", "on-time"] }, 1, 0] },
            },
            lateCount: {
              $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
            },
            absentCount: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },
            overtimeHours: { $sum: "$overtimeHours" },
          },
        },
      ]);

      // Get time-off data
      const timeOffData = await TimeOff.aggregate([
        {
          $match: {
            startDate: { $gte: new Date(startDate) },
            endDate: { $lte: new Date(endDate) },
            status: "approved",
            user: { $in: userIds },
          },
        },
        {
          $group: {
            _id: null,
            totalTimeOffDays: { $sum: "$days" },
            sickDays: {
              $sum: { $cond: [{ $eq: ["$type", "sick"] }, "$days", 0] },
            },
            vacationDays: {
              $sum: { $cond: [{ $eq: ["$type", "vacation"] }, "$days", 0] },
            },
            personalDays: {
              $sum: { $cond: [{ $eq: ["$type", "personal"] }, "$days", 0] },
            },
          },
        },
      ]);

      departmentSummaries.push({
        department: dept,
        employeeCount: departmentUsers.length,
        attendance:
          attendanceData.length > 0
            ? attendanceData[0]
            : {
                totalWorkHours: 0,
                totalBreakHours: 0,
                onTimeCount: 0,
                lateCount: 0,
                absentCount: 0,
                overtimeHours: 0,
              },
        timeOff:
          timeOffData.length > 0
            ? timeOffData[0]
            : {
                totalTimeOffDays: 0,
                sickDays: 0,
                vacationDays: 0,
                personalDays: 0,
              },
      });
    }

    res.json(departmentSummaries);
  } catch (err) {
    console.error("Error generating department summary report:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/reports/user-details/:userId
// @desc    Get detailed user report
// @access  Private (Admin/Manager/Self)
router.get(
  "/user-details/:userId",
  auth,
  canAccessReports,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Start date and end date are required" });
      }

      // Check authorization
      if (req.user.id !== userId && !req.user.isAdmin && !req.user.isManager) {
        return res
          .status(403)
          .json({ message: "Not authorized to access this report" });
      }

      // Get user details
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get attendance data
      const attendanceData = await Attendance.find({
        user: userId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      }).sort({ date: 1 });

      // Get time-off data
      const timeOffData = await TimeOff.find({
        user: userId,
        startDate: { $gte: new Date(startDate) },
        endDate: { $lte: new Date(endDate) },
      }).sort({ startDate: 1 });

      // Get schedule data
      const scheduleData = await Schedule.find({
        user: userId,
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      }).sort({ startDate: 1 });

      // Calculate summary statistics
      const totalWorkHours = attendanceData.reduce(
        (sum, record) => sum + record.totalWorkHours,
        0,
      );
      const totalBreakHours = attendanceData.reduce(
        (sum, record) => sum + record.totalBreakTime,
        0,
      );
      const totalOvertimeHours = attendanceData.reduce(
        (sum, record) => sum + (record.overtimeHours || 0),
        0,
      );

      const onTimeCount = attendanceData.filter(
        (record) => record.status === "on-time",
      ).length;
      const lateCount = attendanceData.filter(
        (record) => record.status === "late",
      ).length;
      const earlyDepartureCount = attendanceData.filter(
        (record) => record.status === "early-departure",
      ).length;
      const absentCount = attendanceData.filter(
        (record) => record.status === "absent",
      ).length;

      const totalTimeOffDays = timeOffData.reduce(
        (sum, record) => sum + record.days,
        0,
      );
      const approvedTimeOffDays = timeOffData
        .filter((record) => record.status === "approved")
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
          attendanceRate:
            attendanceData.length > 0
              ? (onTimeCount / attendanceData.length) * 100
              : 0,
          totalTimeOffDays,
          approvedTimeOffDays,
        },
        attendanceRecords: attendanceData,
        timeOffRecords: timeOffData,
        scheduleRecords: scheduleData,
      };

      res.json(userReport);
    } catch (err) {
      console.error("Error generating user details report:", err.message);
      res.status(500).send("Server Error");
    }
  },
);

/**
 * @route   GET api/reports/user-stats
 * @desc    Get stats for a specific user
 * @access  Private
 */
router.get("/user-stats", auth, canAccessReports, async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id; // Changed from req.user.id to req.user._id

    // Check if user has permission to view stats for this user
    if (userId !== req.user._id && !req.user.isAdmin && !req.user.isManager) {
      // Changed from req.user.id to req.user._id
      return res.status(403).json({
        message: "Access denied. Not authorized to view stats for this user.",
      });
    }

    // Get current month's date range
    const startDate = moment().startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();

    // Get attendance records for the user
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate total hours worked
    let totalHours = 0;
    attendanceRecords.forEach((record) => {
      if (record.clockIn && record.clockOut) {
        const clockIn = moment(record.clockIn);
        const clockOut = moment(record.clockOut);
        const duration = moment.duration(clockOut.diff(clockIn));
        totalHours += duration.asHours();
      }
    });

    // Calculate attendance rate
    const workDays = getWorkDays(startDate, endDate);
    const attendedDays = new Set(
      attendanceRecords.map((record) =>
        moment(record.date).format("YYYY-MM-DD"),
      ),
    ).size;

    const attendanceRate =
      workDays > 0 ? Math.round((attendedDays / workDays) * 100) : 0;

    // Get schedule data
    const schedules = await Schedule.find({
      user: userId,
      startDate: { $gte: startDate, $lte: endDate },
    });

    // Get time off data
    const timeOffRequests = await TimeOff.find({
      user: userId,
      status: "approved",
      startDate: { $gte: startDate },
    }).sort({ startDate: 1 });

    res.json({
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
      attendanceRate,
      scheduledDays: schedules.length,
      upcomingTimeOff: timeOffRequests.length,
    });
  } catch (err) {
    console.error("Error getting user stats:", err);
    res.status(500).json({ message: "Server error while fetching user stats" });
  }
});

// @route   GET api/reports/summary
// @desc    Get summary report
// @access  Private (Admin/Manager)
router.get("/summary", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department, userId } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build base query
    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Add user filter if specified
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      query.user = new mongoose.Types.ObjectId(userId);
    }
    // Add department filter if specified
    else if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }

      // Check if department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Get users in department
      const departmentUsers = await User.find({ department }).select("_id");
      if (!departmentUsers.length) {
        return res
          .status(404)
          .json({ message: "No users found in the specified department" });
      }
      query.user = { $in: departmentUsers.map((user) => user._id) };
    }

    // Get attendance summary
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          totalWorkHours: { $sum: { $ifNull: ["$totalWorkHours", 0] } },
          totalBreakHours: { $sum: { $ifNull: ["$totalBreakTime", 0] } },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ["$status", "on-time"] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
          overtimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
        },
      },
    ]);

    // Get schedule summary
    const scheduleQuery = {
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    };
    if (query.user) {
      scheduleQuery.user = query.user;
    }

    const scheduleSummary = await Schedule.aggregate([
      { $match: scheduleQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ["$hoursPerDay", 0] } },
        },
      },
    ]);

    // Get time off summary
    const timeOffQuery = {
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
      status: "approved",
    };
    if (query.user) {
      timeOffQuery.user = query.user;
    }

    const timeOffSummary = await TimeOff.aggregate([
      { $match: timeOffQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDays: { $sum: { $ifNull: ["$days", 0] } },
        },
      },
    ]);

    // Calculate work days in the period
    const workDays = getWorkDays(new Date(startDate), new Date(endDate));

    // Format response
    const summary = {
      period: {
        startDate,
        endDate,
        totalWorkDays: workDays,
        department: department
          ? await Department.findById(department).select("name code")
          : null,
      },
      attendance: attendanceSummary[0] || {
        totalAttendance: 0,
        totalWorkHours: 0,
        totalBreakHours: 0,
        onTimeCount: 0,
        lateCount: 0,
        overtimeHours: 0,
      },
      schedules: scheduleSummary.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          totalHours: curr.totalHours,
        };
        return acc;
      }, {}),
      timeOff: timeOffSummary.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          totalDays: curr.totalDays,
        };
        return acc;
      }, {}),
    };

    res.json(summary);
  } catch (err) {
    console.error("Error generating summary report:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
});

// @route   GET api/reports/user-stats
// @desc    Get user's own stats
// @access  Private
router.get("/user-stats", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Build query for current user
    const query = {
      user: req.user._id, // Changed from req.user.id to req.user._id
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Get attendance summary
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          totalWorkHours: { $sum: { $ifNull: ["$totalWorkHours", 0] } },
          totalBreakHours: { $sum: { $ifNull: ["$totalBreakTime", 0] } },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ["$status", "on-time"] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
          overtimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
        },
      },
    ]);

    // Get schedule summary
    const scheduleQuery = {
      user: req.user._id, // Changed from req.user.id to req.user._id
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    };

    const scheduleSummary = await Schedule.aggregate([
      { $match: scheduleQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ["$hoursPerDay", 0] } },
        },
      },
    ]);

    // Get time off summary
    const timeOffQuery = {
      user: req.user._id, // Changed from req.user.id to req.user._id
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
      status: "approved",
    };

    const timeOffSummary = await TimeOff.aggregate([
      { $match: timeOffQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDays: { $sum: { $ifNull: ["$days", 0] } },
        },
      },
    ]);

    // Calculate work days in the period
    const workDays = getWorkDays(new Date(startDate), new Date(endDate));

    // Get user details
    const user = await User.findById(req.user._id) // Changed from req.user.id to req.user._id
      .select("firstName lastName department position")
      .populate("department", "name code");

    // Format response
    const summary = {
      period: {
        startDate,
        endDate,
        totalWorkDays: workDays,
      },
      user: {
        name: `${user.firstName} ${user.lastName}`,
        position: user.position,
        department: user.department,
      },
      attendance: attendanceSummary[0] || {
        totalAttendance: 0,
        totalWorkHours: 0,
        totalBreakHours: 0,
        onTimeCount: 0,
        lateCount: 0,
        overtimeHours: 0,
      },
      schedules: scheduleSummary.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          totalHours: curr.totalHours,
        };
        return acc;
      }, {}),
      timeOff: timeOffSummary.reduce((acc, curr) => {
        acc[curr._id] = {
          count: curr.count,
          totalDays: curr.totalDays,
        };
        return acc;
      }, {}),
    };

    res.json(summary);
  } catch (err) {
    console.error("Error generating user stats:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
});

// Helper function to get number of work days in a date range
function getWorkDays(startDate, endDate) {
  let count = 0;
  let curDate = new Date(startDate);
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// Get report data
router.get("/data", auth, reportController.getReportData);

// Export report
router.get(
  "/export/:reportType",
  auth,
  canAccessReports,
  reportController.exportReport,
);

// Generate specific type of report (summary/detailed)
router.get("/:type", auth, isManagerOrAdmin, reportController.generateReport);

module.exports = router;
