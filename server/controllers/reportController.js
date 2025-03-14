const Schedule = require("../models/Schedule");
const Attendance = require("../models/Attendance");
const TimeOff = require("../models/TimeOff");
const User = require("../models/User");
const moment = require("moment");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Get report data
exports.getReportData = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Check permissions
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";

    // Build query
    let query = {
      startDate: {
        $lte: moment(endDate).endOf("day").toDate(),
      },
      endDate: {
        $gte: moment(startDate).startOf("day").toDate(),
      },
    };

    // If not admin/manager, only show user's own data
    if (!isAdmin && !isManager) {
      query.user = req.user.id;
    } else if (userId) {
      // Admin/manager can view specific user's data
      query.user = userId;
    }

    const schedules = await Schedule.find(query).populate(
      "user",
      "firstName lastName department position",
    );

    const attendanceRecords = await Attendance.find({
      ...query,
      date: {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      },
    }).populate("user", "firstName lastName department position");

    // Get time off records
    const timeOffRecords = await TimeOff.find({
      user: query.user || { $exists: true },
      startDate: { $lte: moment(endDate).endOf("day").toDate() },
      endDate: { $gte: moment(startDate).startOf("day").toDate() },
      status: "approved",
    }).populate("user", "firstName lastName department position");

    // Calculate work days in the period
    const workDays = getWorkDays(new Date(startDate), new Date(endDate));

    // Calculate attendance stats
    const attendanceStats = {
      totalAttendance: attendanceRecords.length,
      totalWorkHours: attendanceRecords.reduce(
        (sum, record) => sum + (record.totalWorkHours || 0),
        0,
      ),
      totalBreakHours: attendanceRecords.reduce(
        (sum, record) => sum + (record.totalBreakTime || 0),
        0,
      ),
      onTimeCount: attendanceRecords.filter(
        (record) => record.status === "on-time",
      ).length,
      lateCount: attendanceRecords.filter((record) => record.status === "late")
        .length,
      overtimeHours: attendanceRecords.reduce(
        (sum, record) => sum + (record.overtimeHours || 0),
        0,
      ),
    };

    // Calculate schedule stats
    const scheduleStats = schedules.reduce((acc, schedule) => {
      const type = schedule.type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalHours: 0 };
      }
      acc[type].count++;
      acc[type].totalHours += schedule.hoursPerDay || 0;
      return acc;
    }, {});

    // Calculate time off stats
    const timeOffStats = timeOffRecords.reduce((acc, record) => {
      const type = record.type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalDays: 0 };
      }
      acc[type].count++;
      acc[type].totalDays += record.days || 0;
      return acc;
    }, {});

    res.json({
      period: {
        startDate,
        endDate,
        totalWorkDays: workDays,
      },
      attendance: attendanceStats,
      schedules: scheduleStats,
      timeOff: timeOffStats,
    });
  } catch (error) {
    console.error("Error getting report data:", error);
    res.status(500).json({
      message: "Error getting report data",
      error: error.message,
    });
  }
};

// Generate specific type of report
exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const reportType = req.params.type;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";

    // Only admin/manager can generate reports for other users
    if (userId && !isAdmin && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to view other users' reports" });
    }

    // Build query
    let query = {
      startDate: {
        $lte: moment(endDate).endOf("day").toDate(),
      },
      endDate: {
        $gte: moment(startDate).startOf("day").toDate(),
      },
    };

    // If not admin/manager, only show user's own data
    if (!isAdmin && !isManager) {
      query.user = req.user.id;
    } else if (userId) {
      query.user = userId;
    }

    let schedules, attendanceRecords;
    if (reportType === "attendance-summary") {
      attendanceRecords = await Attendance.find({
        ...query,
        date: {
          $gte: moment(startDate).startOf("day").toDate(),
          $lte: moment(endDate).endOf("day").toDate(),
        },
      }).populate("user", "firstName lastName department position");

      return res.json(generateAttendanceSummary(attendanceRecords));
    } else {
      schedules = await Schedule.find(query).populate(
        "user",
        "firstName lastName department position",
      );

      if (reportType === "summary") {
        return res.json(generateSummaryReport(schedules));
      } else if (reportType === "detailed") {
        return res.json(generateDetailedReport(schedules));
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating report" });
  }
};

// Helper function to generate summary report
const generateSummaryReport = (schedules) => {
  const summary = {
    totalSchedules: schedules.length,
    totalHours: 0,
    schedulesByType: {},
    schedulesByDay: {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    },
  };

  schedules.forEach((schedule) => {
    // Calculate hours per day
    const hoursPerDay = moment(schedule.endTime, "HH:mm").diff(
      moment(schedule.startTime, "HH:mm"),
      "hours",
      true,
    );

    // Multiply by number of days in schedule
    const totalHours = hoursPerDay * schedule.days.length;
    summary.totalHours += totalHours;

    // Count by type
    summary.schedulesByType[schedule.type] =
      (summary.schedulesByType[schedule.type] || 0) + totalHours;

    // Count by day
    schedule.days.forEach((day) => {
      summary.schedulesByDay[day.charAt(0).toUpperCase() + day.slice(1)] +=
        hoursPerDay;
    });
  });

  return summary;
};

// Helper function to generate detailed report
const generateDetailedReport = (schedules) => {
  return schedules.map((schedule) => ({
    startDate: moment(schedule.startDate).format("YYYY-MM-DD"),
    endDate: moment(schedule.endDate).format("YYYY-MM-DD"),
    type: schedule.type,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    days: schedule.days,
    notes: schedule.notes,
    hoursPerDay: moment(schedule.endTime, "HH:mm").diff(
      moment(schedule.startTime, "HH:mm"),
      "hours",
      true,
    ),
    user: schedule.user
      ? `${schedule.user.firstName} ${schedule.user.lastName}`
      : "Unknown",
  }));
};

// Helper function to generate attendance summary
const generateAttendanceSummary = (records) => {
  return records.map((record) => ({
    date: moment(record.clockIn).format("YYYY-MM-DD"),
    clockIn: moment(record.clockIn).format("HH:mm"),
    clockOut: record.clockOut ? moment(record.clockOut).format("HH:mm") : null,
    totalHours: record.clockOut
      ? moment(record.clockOut).diff(moment(record.clockIn), "hours", true)
      : null,
    totalBreakTime: record.totalBreakTime || 0,
    status: record.status,
    notes: record.notes,
    user: record.user
      ? `${record.user.firstName} ${record.user.lastName}`
      : "Unknown",
  }));
};

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

// Export report in various formats
exports.exportReport = async (req, res) => {
  try {
    const { format, startDate, endDate, userId } = req.query;
    const reportType = req.params.type;

    // Check permissions
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";

    // Only admin/manager can export reports for other users
    if (userId && !isAdmin && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to export other users' reports" });
    }

    // Get report data
    const reportData = await exports.getReportData(req, res);

    // Generate export based on format
    if (format === "pdf") {
      const doc = new PDFDocument();
      doc.pipe(res);

      // Add report content
      doc.fontSize(20).text("Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(JSON.stringify(reportData, null, 2));

      doc.end();
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Report");

      // Add headers
      worksheet.columns = [
        { header: "Date", key: "date" },
        { header: "Hours", key: "hours" },
        { header: "Status", key: "status" },
      ];

      // Add data
      worksheet.addRows(reportData);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=report.csv");

      // Convert report data to CSV
      const csv = Object.entries(reportData)
        .map(([key, value]) => `${key},${value}`)
        .join("\n");

      res.send(csv);
    } else {
      return res.status(400).json({ message: "Invalid export format" });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({
      message: "Error exporting report",
      error: error.message,
    });
  }
};
