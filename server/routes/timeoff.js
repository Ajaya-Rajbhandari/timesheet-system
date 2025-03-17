const express = require("express");
const router = express.Router();
const {
  auth,
  isManagerOrAdmin,
  isSelfOrHigherRole,
} = require("../middleware/auth");
const TimeOff = require("../models/TimeOff");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * @route   POST api/timeoff
 * @desc    Create a new time-off request
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const { type, startDate, endDate, reason, attachments } = req.body;

    console.log("Received time-off request data:", {
      type,
      startDate,
      endDate,
      reason,
    });

    // Get user's department
    const user = await User.findById(req.user.id).populate("department");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      department: user.department,
    });

    if (!user.department) {
      return res.status(400).json({
        message:
          "User does not have a department assigned. Please contact your administrator.",
      });
    }

    // Create new time-off request
    const timeOffData = {
      user: req.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      attachments: attachments || [],
      department: user.department._id, // Ensure we're using the department ID
    };

    console.log("Creating time-off request with data:", timeOffData);

    const timeOff = new TimeOff(timeOffData);

    // Validate the model before saving
    const validationError = timeOff.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError);
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(validationError.errors).map((e) => e.message),
      });
    }

    await timeOff.save();
    console.log("Time-off request created successfully:", timeOff._id);

    res.json(timeOff);
  } catch (err) {
    console.error("Create time-off request error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route   GET api/timeoff
 * @desc    Get all time-off requests (for admin/manager)
 * @access  Private (Admin/Manager)
 */
router.get("/", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = {};

    // For managers, only show requests from their department
    if (req.user.role === "manager") {
      const user = await User.findById(req.user.id);
      query.department = user.department;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ];
    }

    const timeOffRequests = await TimeOff.find(query)
      .populate({
        path: "user",
        select: "firstName lastName employeeId department",
        populate: {
          path: "department",
          select: "name"
        }
      })
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(timeOffRequests);
  } catch (err) {
    console.error("Get time-off requests error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/timeoff/my-requests
 * @desc    Get current user's time-off requests
 * @access  Private
 */
router.get("/my-requests", auth, async (req, res) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      console.error("Invalid user ID format:", req.user._id);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const { status, year } = req.query;

    let query = { user: req.user._id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by year if provided
    if (year) {
      if (isNaN(year) || year.length !== 4) {
        return res.status(400).json({ message: "Invalid year format" });
      }
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 0);

      query.$or = [
        {
          startDate: { $gte: startOfYear, $lte: endOfYear },
        },
        {
          endDate: { $gte: startOfYear, $lte: endOfYear },
        },
      ];
    }

    const timeOffRequests = await TimeOff.find(query)
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(timeOffRequests);
  } catch (err) {
    console.error("Get my time-off requests error:", {
      message: err.message,
      stack: err.stack,
      user: req.user._id,
    });
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * @route   GET api/timeoff/:id
 * @desc    Get time-off request by ID
 * @access  Private (Self/Admin/Manager)
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const timeOff = await TimeOff.findById(req.params.id)
      .populate("user", "firstName lastName employeeId department")
      .populate("approvedBy", "firstName lastName")
      .populate("comments.user", "firstName lastName");

    if (!timeOff) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Check if user has permission to view this request
    if (
      req.user.role !== "admin" &&
      req.user.role !== "manager" &&
      timeOff.user._id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this request" });
    }

    res.json(timeOff);
  } catch (err) {
    console.error("Get time-off request error:", err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/timeoff/:id
 * @desc    Update time-off request (only if pending)
 * @access  Private (Self only)
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { type, startDate, endDate, reason, attachments } = req.body;

    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);

    if (!timeOff) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Check if user is the owner of the request
    if (timeOff.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this request" });
    }

    // Check if request is still pending
    if (timeOff.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot update request that is not pending" });
    }

    // Build time-off object
    const timeOffFields = {};
    if (type) timeOffFields.type = type;
    if (startDate) timeOffFields.startDate = new Date(startDate);
    if (endDate) timeOffFields.endDate = new Date(endDate);
    if (reason) timeOffFields.reason = reason;
    if (attachments) timeOffFields.attachments = attachments;

    // Update time-off request
    timeOff = await TimeOff.findByIdAndUpdate(
      req.params.id,
      { $set: timeOffFields },
      { new: true },
    ).populate("user", "firstName lastName");

    res.json(timeOff);
  } catch (err) {
    console.error("Update time-off request error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/timeoff/:id/status
 * @desc    Update time-off request status (approve/reject)
 * @access  Private (Admin/Manager)
 */
router.put("/:id/status", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);

    if (!timeOff) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Check if request is pending
    if (timeOff.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request has already been processed" });
    }

    // Update status
    timeOff.status = status;
    timeOff.approvedBy = req.user.id;
    timeOff.approvalDate = Date.now();

    // Add comment if provided
    if (comment) {
      timeOff.comments.push({
        user: req.user.id,
        text: comment,
      });
    }

    await timeOff.save();

    // Populate user and approver details
    timeOff = await TimeOff.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("approvedBy", "firstName lastName");

    res.json(timeOff);
  } catch (err) {
    console.error("Update time-off status error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/timeoff/:id/cancel
 * @desc    Cancel time-off request
 * @access  Private (Self only)
 */
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);

    if (!timeOff) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Check if user is the owner of the request
    if (timeOff.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    // Check if request can be cancelled
    if (timeOff.status !== "pending" && timeOff.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Cannot cancel request with current status" });
    }

    // Update status
    timeOff.status = "cancelled";

    await timeOff.save();

    res.json(timeOff);
  } catch (err) {
    console.error("Cancel time-off request error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST api/timeoff/:id/comment
 * @desc    Add comment to time-off request
 * @access  Private (Self/Admin/Manager)
 */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Check if time-off request exists
    let timeOff = await TimeOff.findById(req.params.id);

    if (!timeOff) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Check if user has permission
    if (
      req.user.role !== "admin" &&
      req.user.role !== "manager" &&
      timeOff.user.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to comment on this request" });
    }

    // Add comment
    timeOff.comments.push({
      user: req.user.id,
      text,
    });

    await timeOff.save();

    // Populate user details for comments
    timeOff = await TimeOff.findById(req.params.id).populate(
      "comments.user",
      "firstName lastName",
    );

    res.json(timeOff.comments);
  } catch (err) {
    console.error("Add comment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/timeoff/user/:userId
 * @desc    Get time-off requests for a specific user
 * @access  Private (Self/Admin/Manager)
 */
router.get("/user/:userId", auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const { status, year } = req.query;

    let query = { user: req.params.userId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 0);

      query.$or = [
        {
          startDate: { $gte: startOfYear, $lte: endOfYear },
        },
        {
          endDate: { $gte: startOfYear, $lte: endOfYear },
        },
      ];
    }

    const timeOffRequests = await TimeOff.find(query)
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(timeOffRequests);
  } catch (err) {
    console.error("Get user time-off requests error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/** 
 * @route   PUT api/timeoff/:id/approve
 * @desc    Approve a time off request
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const timeOff = await TimeOff.findById(req.params.id);
    
    // Self-approval check
    if (timeOff.user.toString() === req.user.id) {
      return res.status(403).json({
        message: "Cannot approve your own time-off request",
        errorCode: "SELF_APPROVAL_DISALLOWED"
      });
    }

    // Approval logic
    if (timeOff.status !== 'pending') {
      return res.status(400).json({
        message: `Request already ${timeOff.status}`,
        currentStatus: timeOff.status
      });
    }

    timeOff.status = 'approved';
    timeOff.approvedBy = req.user.id;
    await timeOff.save();

    const populatedRequest = await TimeOff.findById(timeOff._id)
      .populate('approvedBy', 'firstName lastName email');

    res.json({
      message: 'Time off approved',
      timeOff: populatedRequest
    });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ 
      message: 'Server error during approval',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add this with other routes
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { year } = req.query;
    
    const query = { 
      user: req.user.id,
      ...(year && {
        startDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      })
    };

    const requests = await TimeOff.find(query)
      .sort({ startDate: -1 })
      .populate('approvedBy', 'firstName lastName');

    res.json(requests);
  } catch (err) {
    console.error('Error fetching time-off requests:', err);
    res.status(500).json({ message: 'Error retrieving your requests' });
  }
});

module.exports = router;
