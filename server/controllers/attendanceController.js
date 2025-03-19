const Attendance = require("../models/Attendance");

exports.getCurrentAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      user: req.user._id,
      endTime: { $exists: false },
    }).populate("user", "firstName lastName");

    if (!attendance) {
      return res.status(404).json({ message: "No active attendance record" });
    }

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching current attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};
