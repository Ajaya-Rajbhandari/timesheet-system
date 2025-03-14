require("dotenv").config();
const mongoose = require("mongoose");
const moment = require("moment");
const Attendance = require("../models/Attendance");

async function cleanupAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all active sessions except the most recent one for each user
    const activeRecords = await Attendance.aggregate([
      {
        $match: {
          clockOut: null,
        },
      },
      {
        $sort: {
          clockIn: -1,
        },
      },
      {
        $group: {
          _id: "$user",
          records: {
            $push: {
              _id: "$_id",
              clockIn: "$clockIn",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    console.log("\nCleaning up multiple active sessions...");

    for (const userRecords of activeRecords) {
      // Skip the first record (most recent) and close all others
      const recordsToClose = userRecords.records.slice(1);

      for (const record of recordsToClose) {
        await Attendance.findByIdAndUpdate(record._id, {
          $set: {
            clockOut: moment(record.clockIn).endOf("day").toDate(),
            updatedAt: new Date(),
          },
        });
        console.log(`Closed session for record: ${record._id}`);
      }
    }

    console.log("\nCleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanupAttendance();
