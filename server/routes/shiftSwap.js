const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const ShiftSwap = require("../models/ShiftSwap");
const Schedule = require("../models/Schedule");
const User = require("../models/User");

/**
 * @route   POST api/shift-swaps/request
 * @desc    Request a shift swap
 * @access  Private
 */
router.post("/request", auth, async (req, res) => {
  try {
    const { targetUserId, requestingScheduleId, targetScheduleId, reason } =
      req.body;

    // Validate input
    if (
      !targetUserId ||
      !requestingScheduleId ||
      !targetScheduleId ||
      !reason
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if schedules exist and belong to respective users
    const [requestingSchedule, targetSchedule, targetUser] = await Promise.all([
      Schedule.findById(requestingScheduleId),
      Schedule.findById(targetScheduleId),
      User.findById(targetUserId),
    ]);

    if (!requestingSchedule || !targetSchedule || !targetUser) {
      return res.status(404).json({ message: "Schedule or user not found" });
    }

    if (requestingSchedule.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to swap this schedule" });
    }

    if (targetSchedule.user.toString() !== targetUserId) {
      return res
        .status(403)
        .json({ message: "Target schedule does not belong to target user" });
    }

    // Create shift swap request
    const shiftSwap = new ShiftSwap({
      requestingUser: req.user._id,
      targetUser: targetUserId,
      requestingSchedule: requestingScheduleId,
      targetSchedule: targetScheduleId,
      reason,
    });

    await shiftSwap.save();

    // Populate response data
    await shiftSwap.populate([
      { path: "requestingUser", select: "firstName lastName email" },
      { path: "targetUser", select: "firstName lastName email" },
      { path: "requestingSchedule" },
      { path: "targetSchedule" },
    ]);

    res.status(201).json(shiftSwap);
  } catch (err) {
    console.error("Shift swap request error:", err);
    res
      .status(500)
      .json({ message: "Server error while creating shift swap request" });
  }
});

/**
 * @route   GET api/shift-swaps
 * @desc    Get user's shift swaps (both requesting and target)
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    console.log("Fetching shift swaps for user:", req.user._id);

    const swaps = await ShiftSwap.find({
      $or: [{ requestingUser: req.user._id }, { targetUser: req.user._id }],
    })
      .sort({ requestDate: -1 })
      .populate([
        { path: "requestingUser", select: "firstName lastName email" },
        { path: "targetUser", select: "firstName lastName email" },
        { path: "requestingSchedule" },
        { path: "targetSchedule" },
      ]);

    console.log("Found shift swaps:", swaps.length);
    console.log(
      "Shift swaps where user is target:",
      swaps.filter(
        (swap) => swap.targetUser._id.toString() === req.user._id.toString(),
      ).length,
    );

    res.json(swaps);
  } catch (err) {
    console.error("Get shift swaps error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching shift swaps" });
  }
});

/**
 * @route   PUT api/shift-swaps/:id/respond
 * @desc    Respond to a shift swap request
 * @access  Private
 */
router.put("/:id/respond", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    console.log("Processing shift swap response:", {
      swapId: req.params.id,
      status,
      notes,
    });

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const swap = await ShiftSwap.findById(req.params.id)
      .populate("requestingUser", "firstName lastName email department")
      .populate("targetUser", "firstName lastName email department")
      .populate("requestingSchedule")
      .populate("targetSchedule");

    if (!swap) {
      return res.status(404).json({ message: "Shift swap request not found" });
    }

    if (swap.targetUser._id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to respond to this request" });
    }

    if (swap.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This request has already been processed" });
    }

    // Log schedule dates for debugging
    console.log("Schedule dates:", {
      currentTime: new Date().toISOString(),
      requestingSchedule: {
        startDate: swap.requestingSchedule.startDate.toISOString(),
        endDate: swap.requestingSchedule.endDate.toISOString(),
      },
      targetSchedule: {
        startDate: swap.targetSchedule.startDate.toISOString(),
        endDate: swap.targetSchedule.endDate.toISOString(),
      },
    });

    // Check if the swap is still valid
    const isValid = await swap.isValidForApproval();
    if (!isValid) {
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Provide more specific error message based on the validation failure
      if (!swap.requestingSchedule || !swap.targetSchedule) {
        return res
          .status(400)
          .json({ message: "One or both schedules no longer exist" });
      }

      const requestingStart = new Date(swap.requestingSchedule.startDate);
      const targetStart = new Date(swap.targetSchedule.startDate);

      if (requestingStart <= bufferTime || targetStart <= bufferTime) {
        return res.status(400).json({
          message:
            "Cannot swap shifts that start within the next 24 hours. This is to ensure proper scheduling and staffing.",
          details: {
            bufferTime: bufferTime.toISOString(),
            requestingStart: requestingStart.toISOString(),
            targetStart: targetStart.toISOString(),
          },
        });
      }

      return res
        .status(400)
        .json({ message: "This swap request is no longer valid" });
    }

    // Check if users are in the same department
    if (
      swap.requestingUser.department.toString() !==
      swap.targetUser.department.toString()
    ) {
      return res.status(400).json({
        message: "Cannot swap shifts with users from different departments",
      });
    }

    // Update swap status and details
    swap.status = status;
    swap.responseDate = Date.now();
    if (notes) swap.notes = notes;

    await swap.save();

    // Re-populate for response
    await swap.populate([
      { path: "requestingUser", select: "firstName lastName email department" },
      { path: "targetUser", select: "firstName lastName email department" },
      { path: "requestingSchedule" },
      { path: "targetSchedule" },
    ]);

    console.log("Successfully processed shift swap response:", {
      swapId: swap._id,
      status: swap.status,
      requestingUser: swap.requestingUser._id,
      targetUser: swap.targetUser._id,
    });

    res.json(swap);
  } catch (err) {
    console.error("Shift swap response error:", err);
    res.status(500).json({
      message:
        err.message || "Server error while processing shift swap response",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

/**
 * @route   PUT api/shift-swaps/:id/manager-approval
 * @desc    Manager approval for shift swap
 * @access  Private
 */
router.put("/:id/manager-approval", auth, async (req, res) => {
  try {
    const { approved, notes } = req.body;

    // Verify user is a manager or admin
    if (!["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to approve this swap" });
    }

    const swap = await ShiftSwap.findById(req.params.id)
      .populate("requestingUser", "firstName lastName email department")
      .populate("targetUser", "firstName lastName email department")
      .populate("requestingSchedule")
      .populate("targetSchedule");

    if (!swap) {
      return res.status(404).json({ message: "Shift swap request not found" });
    }

    // Check if the manager is in the same department as the users involved in the swap
    if (!swap.requestingUser || !swap.targetUser) {
      return res
        .status(404)
        .json({ message: "Users involved in swap not found" });
    }

    // For admin, allow approval of any swap
    // For managers, only allow approval of swaps in their department
    if (
      req.user.role === "manager" &&
      req.user.department.toString() !==
        swap.requestingUser.department.toString() &&
      req.user.department.toString() !== swap.targetUser.department.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to approve swaps outside your department",
      });
    }

    if (swap.status !== "approved") {
      return res.status(400).json({
        message:
          "This request must be approved by both users before manager approval",
      });
    }

    if (swap.managerApproval) {
      return res.status(400).json({
        message: "This request has already been processed by a manager",
      });
    }

    // Validate that schedules are still valid
    const now = new Date();
    if (
      swap.requestingSchedule.startDate <= now ||
      swap.targetSchedule.startDate <= now
    ) {
      return res
        .status(400)
        .json({ message: "Cannot swap past or current schedules" });
    }

    // Create manager approval
    swap.managerApproval = {
      approved,
      approvedBy: req.user.id,
      approvalDate: Date.now(),
      notes: notes || undefined,
    };

    // Only update schedules if approved
    if (approved) {
      // Update schedules
      const [reqSchedule, targetSchedule] = await Promise.all([
        Schedule.findById(swap.requestingSchedule),
        Schedule.findById(swap.targetSchedule),
      ]);

      if (!reqSchedule || !targetSchedule) {
        return res
          .status(404)
          .json({ message: "One or both schedules no longer exist" });
      }

      // Swap the users
      const tempUser = reqSchedule.user;
      reqSchedule.user = targetSchedule.user;
      targetSchedule.user = tempUser;

      // Update the last modified information
      reqSchedule.updatedBy = req.user.id;
      targetSchedule.updatedBy = req.user.id;

      await Promise.all([reqSchedule.save(), targetSchedule.save()]);

      swap.status = "completed";
    } else {
      swap.status = "rejected";
    }

    await swap.save();

    // Re-populate all fields for response
    await swap.populate([
      { path: "requestingUser", select: "firstName lastName email department" },
      { path: "targetUser", select: "firstName lastName email department" },
      { path: "requestingSchedule" },
      { path: "targetSchedule" },
      {
        path: "managerApproval.approvedBy",
        select: "firstName lastName email",
      },
    ]);

    res.json(swap);
  } catch (err) {
    console.error("Shift swap manager approval error:", err);
    res.status(500).json({
      message:
        err.message ||
        "Server error while processing shift swap manager approval",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

/**
 * @route   GET api/shift-swaps/department/:departmentId
 * @desc    Get department shift swaps (manager only)
 * @access  Private
 */
router.get("/department/:departmentId", auth, async (req, res) => {
  try {
    // Verify user is a manager or admin
    if (!["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view department swaps" });
    }

    // Get all swaps where either the requesting or target user is in the department
    const departmentUsers = await User.find({
      department: req.params.departmentId,
    });
    const userIds = departmentUsers.map((user) => user._id);

    const swaps = await ShiftSwap.find({
      $or: [
        { requestingUser: { $in: userIds } },
        { targetUser: { $in: userIds } },
      ],
    })
      .sort({ requestDate: -1 })
      .populate([
        {
          path: "requestingUser",
          select: "firstName lastName email department",
        },
        { path: "targetUser", select: "firstName lastName email department" },
        { path: "requestingSchedule" },
        { path: "targetSchedule" },
      ]);

    res.json(swaps);
  } catch (err) {
    console.error("Get department shift swaps error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching department shift swaps" });
  }
});

/**
 * @route   GET api/shift-swaps/user-schedules/:userId
 * @desc    Get schedules of a user for shift swap purposes
 * @access  Private (All authenticated users)
 */
router.get("/user-schedules/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Get the target user to check their department
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the requesting user is in the same department as the target user
    // or is a manager/admin
    const isInSameDepartment =
      req.user.department.toString() === targetUser.department.toString();
    const isManagerOrAdmin = ["admin", "manager"].includes(req.user.role);

    if (!isInSameDepartment && !isManagerOrAdmin) {
      return res.status(403).json({
        message:
          "Access denied. You can only view schedules of users in your department.",
      });
    }

    // Get schedules for the target user
    const schedules = await Schedule.find({
      user: targetUserId,
      endDate: { $gte: new Date() }, // Only get current and future schedules
    }).sort({ startDate: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Error fetching user schedules for shift swap:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/shift-swaps/department-users
 * @desc    Get users from the same department for shift swap
 * @access  Private (All authenticated users)
 */
router.get("/department-users", auth, async (req, res) => {
  try {
    if (!req.user || !req.user.department) {
      return res
        .status(400)
        .json({ message: "User department information is missing" });
    }

    const userDeptId = req.user.department.toString();

    const users = await User.find({
      department: userDeptId,
      _id: { $ne: req.user._id }, // Exclude the current user
    })
      .select("_id firstName lastName email position")
      .sort({ lastName: 1 });

    res.json(users);
  } catch (err) {
    console.error("Error fetching department users for shift swap:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
