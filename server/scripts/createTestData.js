const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();

// Import models
require("../models/User");
require("../models/Department");
require("../models/Schedule");
require("../models/Attendance");
require("../models/TimeOff");

const User = mongoose.model("User");
const Department = mongoose.model("Department");
const Schedule = mongoose.model("Schedule");
const Attendance = mongoose.model("Attendance");
const TimeOff = mongoose.model("TimeOff");

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/timesheet-system",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => console.log("MongoDB connected for test data creation"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to create test data
async function createTestData() {
  try {
    // Get all users
    const users = await User.find();
    if (users.length === 0) {
      console.log("No users found. Please create users first.");
      process.exit(1);
    }

    console.log(`Found ${users.length} users for test data creation`);

    // Get all departments
    const departments = await Department.find();
    if (departments.length === 0) {
      console.log("No departments found. Please create departments first.");
      process.exit(1);
    }

    // Find admin user to use as createdBy
    const adminUser = users.find((user) => user.isAdmin) || users[0];

    // Current date for reference
    const currentDate = moment();

    // Create schedules for the current month
    const schedulePromises = [];
    const attendancePromises = [];

    for (const user of users) {
      console.log(
        `Creating test data for user: ${user.firstName} ${user.lastName}`,
      );

      // Get user's department or assign a random one
      const userDepartment =
        user.department ||
        departments[Math.floor(Math.random() * departments.length)]._id;

      // Create a weekly schedule for the current month
      const startDate = moment().startOf("month");
      const endDate = moment().endOf("month");

      // Define working days
      const workingDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ];

      // Create schedule
      const schedule = new Schedule({
        user: user._id,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        startTime: "09:00",
        endTime: "17:00",
        days: workingDays,
        type: Math.random() > 0.8 ? "remote" : "regular",
        notes: `Regular schedule for ${user.firstName} ${user.lastName}`,
        createdBy: adminUser._id,
        department: userDepartment,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      schedulePromises.push(schedule.save());

      // Create attendance records for past days AND current week
      // First, create for past days
      for (let i = 0; i < 10; i++) {
        const date = moment().subtract(i, "days");
        const dayOfWeek = date.day();

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const isLate = Math.random() > 0.8;
        const isAbsent = Math.random() > 0.9;

        // Create a date object for the current date at 9:00 AM
        const clockInTime = date
          .clone()
          .hours(isLate ? 9 + Math.floor(Math.random() * 2) : 9)
          .minutes(isLate ? Math.floor(Math.random() * 60) : 0)
          .seconds(0);

        // Create a date object for the current date at 5:00 PM
        const clockOutTime = date
          .clone()
          .hours(17 + Math.floor(Math.random() * 2))
          .minutes(Math.floor(Math.random() * 60))
          .seconds(0);

        if (!isAbsent) {
          const attendance = new Attendance({
            user: user._id,
            clockIn: clockInTime.toDate(),
            clockOut: clockOutTime.toDate(),
            breaks: [],
            totalBreakTime: Math.floor(Math.random() * 60),
            notes: isLate ? "Employee arrived late" : "",
            status: isLate ? "late" : "present",
            createdBy: adminUser._id,
            department: userDepartment,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          attendancePromises.push(attendance.save());
        }
      }

      // Now create attendance records for the current month
      const daysToGenerate = moment().daysInMonth();
      for (let i = 0; i < daysToGenerate; i++) {
        const date = moment().startOf("month").add(i, "days");
        const dayOfWeek = date.day();

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Skip future dates that are beyond today
        if (date.isAfter(moment(), "day")) continue;

        const isLate = Math.random() > 0.8;
        const isAbsent = Math.random() > 0.9;

        // Create a date object for the current date at 9:00 AM
        const clockInTime = date
          .clone()
          .hours(isLate ? 9 + Math.floor(Math.random() * 2) : 9)
          .minutes(isLate ? Math.floor(Math.random() * 60) : 0)
          .seconds(0);

        // Create a date object for the current date at 5:00 PM
        const clockOutTime = date
          .clone()
          .hours(17 + Math.floor(Math.random() * 2))
          .minutes(Math.floor(Math.random() * 60))
          .seconds(0);

        if (!isAbsent) {
          const attendance = new Attendance({
            user: user._id,
            clockIn: clockInTime.toDate(),
            clockOut: clockOutTime.toDate(),
            breaks: [],
            totalBreakTime: Math.floor(Math.random() * 60),
            notes: isLate ? "Employee arrived late" : "",
            status: isLate ? "late" : "present",
            createdBy: adminUser._id,
            department: userDepartment,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          attendancePromises.push(attendance.save());
        }
      }

      // Create time off requests
      const timeOffTypes = ["vacation", "sick", "personal"];
      const timeOffStatuses = ["approved", "pending", "rejected"];

      // Create a few random time off requests
      const numRequests = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numRequests; i++) {
        const startDay = Math.floor(Math.random() * 30) + 1;
        const duration = Math.floor(Math.random() * 5) + 1;

        const timeOffStart = moment().add(startDay, "days");
        const timeOffEnd = timeOffStart.clone().add(duration, "days");

        const timeOff = new TimeOff({
          user: user._id,
          startDate: timeOffStart.toDate(),
          endDate: timeOffEnd.toDate(),
          type: timeOffTypes[Math.floor(Math.random() * timeOffTypes.length)],
          reason: `Time off request for ${duration} days`,
          status:
            timeOffStatuses[Math.floor(Math.random() * timeOffStatuses.length)],
          approvedBy: Math.random() > 0.3 ? adminUser._id : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        attendancePromises.push(timeOff.save());
      }
    }

    // Wait for all promises to resolve
    await Promise.all([...schedulePromises, ...attendancePromises]);

    console.log("Test data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test data:", error);
    process.exit(1);
  }
}

// Run the function
createTestData();
