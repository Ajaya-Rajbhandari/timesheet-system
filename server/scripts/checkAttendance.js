require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

async function checkAttendanceRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const today = moment().startOf("day");
    const tomorrow = moment(today).add(1, "days");

    // Find all attendance records for today
    const records = await Attendance.find({
      clockIn: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate(),
      },
    }).populate("user", "firstName lastName email");

    console.log("\nToday's Attendance Records:");
    if (records.length === 0) {
      console.log("No attendance records found for today");
    } else {
      for (const record of records) {
        console.log(
          `\nUser: ${record.user.firstName} ${record.user.lastName} (${record.user.email})`,
        );
        console.log(`Clock In: ${moment(record.clockIn).format("HH:mm:ss")}`);
        console.log(
          `Clock Out: ${
            record.clockOut
              ? moment(record.clockOut).format("HH:mm:ss")
              : "Not clocked out"
          }`,
        );
        console.log(`Status: ${record.clockOut ? "Completed" : "Active"}`);
      }
    }

    // Find any records that might be stuck (no clock out from previous days)
    const stuckRecords = await Attendance.find({
      clockIn: { $lt: today.toDate() },
      clockOut: null,
    }).populate("user", "firstName lastName email");

    if (stuckRecords.length > 0) {
      console.log("\nStuck Records (no clock out from previous days):");
      for (const record of stuckRecords) {
        console.log(
          `\nUser: ${record.user.firstName} ${record.user.lastName} (${record.user.email})`,
        );
        console.log(
          `Clock In: ${moment(record.clockIn).format("YYYY-MM-DD HH:mm:ss")}`,
        );

        // Auto fix by setting clock out to end of that day
        const endOfDay = moment(record.clockIn).endOf("day");
        record.clockOut = endOfDay.toDate();
        await record.save();
        console.log(
          `Fixed: Set clock out to ${endOfDay.format("YYYY-MM-DD HH:mm:ss")}`,
        );
      }
    }

    console.log("\nCheck complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAttendanceRecords();
