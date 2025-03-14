const express = require("express");
const router = express.Router();
const {
  auth,
  isManagerOrAdmin,
  isSelfOrHigherRole,
} = require("../middleware/auth");
const Schedule = require("../models/Schedule");
const User = require("../models/User");

/**
 * @route   POST api/schedules
 * @desc    Create a new schedule
 * @access  Private (Admin/Manager)
 */
router.post("/", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      startTime,
      endTime,
      type,
      days,
      notes,
    } = req.body;

    // Validate that userId is provided
    if (!userId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    // Check if the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Employee not found" });
    }

    console.log("Creating schedule for user:", userId);

    // Create new schedule
    const schedule = new Schedule({
      user: userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      type,
      days,
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await schedule.save();

    // Populate user and creator details before sending response
    await schedule.populate([
      { path: "user", select: "firstName lastName employeeId" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    res.json(schedule);
  } catch (err) {
    console.error("Create schedule error details:", {
      error: err.message,
      validation: err.errors,
    });
    res.status(500).json({
      message: err.message || "Server error",
      details: err.errors,
    });
  }
});

/**
 * @route   GET api/schedules
 * @desc    Get all schedules (for admin/manager)
 * @access  Private (Admin/Manager)
 */
router.get("/", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let query = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ];
    }

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    const schedules = await Schedule.find(query)
      .populate("user", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")
      .sort({ startDate: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get schedules error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/schedules/user/:userId
 * @desc    Get schedules for a specific user
 * @access  Private (Self/Admin/Manager)
 */
router.get("/user/:userId", auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { user: req.params.userId };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ];
    }

    const schedules = await Schedule.find(query)
      .populate("createdBy", "firstName lastName")
      .sort({ startDate: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get user schedules error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/schedules/my-schedule
 * @desc    Get current user's schedules
 * @access  Private
 */
router.get("/my-schedule", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let query = { user: req.user.id };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ];
    }

    const schedules = await Schedule.find(query)
      .populate("user", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")
      .sort({ startDate: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get my schedules error:", err.message);
    res.status(500).json({ message: "Error fetching your schedules" });
  }
});

/**
 * @route   GET api/schedules/:id
 * @desc    Get schedule by ID
 * @access  Private (Self/Admin/Manager)
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("user", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if user has permission to view this schedule
    if (
      req.user.role !== "admin" &&
      req.user.role !== "manager" &&
      schedule.user.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this schedule" });
    }

    res.json(schedule);
  } catch (err) {
    console.error("Get schedule error:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/schedules/:id
 * @desc    Update schedule
 * @access  Private (Admin/Manager)
 */
router.put("/:id", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const {
      user,
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      days,
      recurrence,
      location,
      department,
      notes,
      color,
      isActive,
    } = req.body;

    // Check if schedule exists
    let schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Build schedule object
    const scheduleFields = {};
    if (user) scheduleFields.user = user;
    if (title) scheduleFields.title = title;
    if (startDate) scheduleFields.startDate = new Date(startDate);
    if (endDate) scheduleFields.endDate = new Date(endDate);
    if (startTime) scheduleFields.startTime = startTime;
    if (endTime) scheduleFields.endTime = endTime;
    if (days) scheduleFields.days = days;
    if (recurrence) scheduleFields.recurrence = recurrence;
    if (location) scheduleFields.location = location;
    if (department) scheduleFields.department = department;
    if (notes) scheduleFields.notes = notes;
    if (color) scheduleFields.color = color;
    if (isActive !== undefined) scheduleFields.isActive = isActive;

    scheduleFields.updatedBy = req.user.id;

    // Update schedule
    schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: scheduleFields },
      { new: true },
    ).populate("user", "firstName lastName employeeId");

    res.json(schedule);
  } catch (err) {
    console.error("Update schedule error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   DELETE api/schedules/:id
 * @desc    Delete schedule
 * @access  Private (Admin/Manager)
 */
router.delete("/:id", auth, isManagerOrAdmin, async (req, res) => {
  try {
    // Check if schedule exists
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Remove schedule
    await Schedule.findByIdAndRemove(req.params.id);

    res.json({ message: "Schedule removed" });
  } catch (err) {
    console.error("Delete schedule error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/schedules/department/:department
 * @desc    Get schedules by department
 * @access  Private (Admin/Manager)
 */
router.get(
  "/department/:department",
  auth,
  isManagerOrAdmin,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let query = { department: req.params.department };

      // Filter by date range if provided
      if (startDate && endDate) {
        query.$or = [
          {
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
          },
        ];
      }

      const schedules = await Schedule.find(query)
        .populate("user", "firstName lastName employeeId")
        .populate("createdBy", "firstName lastName")
        .sort({ startDate: 1 });

      res.json(schedules);
    } catch (err) {
      console.error("Get department schedules error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
