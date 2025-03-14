const express = require("express");
const router = express.Router();
const {
  auth,
  isManagerOrAdmin,
  isSelfOrHigherRole,
} = require("../middleware/auth");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * @route   GET api/users
 * @desc    Get all users
 * @access  Private (Admin/Manager)
 */
router.get("/", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("department", "name code")
      .sort({ lastName: 1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/users/department/:department
 * @desc    Get users by department
 * @access  Private (All authenticated users for their own department)
 */
router.get("/department/:department", auth, async (req, res) => {
  try {
    // Check if user is requesting their own department or is a manager/admin
    const userDeptId = req.user.department.toString();
    const requestedDeptId = req.params.department;

    // Allow access if user is admin/manager or requesting their own department
    const hasAccess =
      ["admin", "manager"].includes(req.user.role) ||
      userDeptId === requestedDeptId;

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "Access denied. You can only view users from your own department.",
      });
    }

    const users = await User.find({
      department: requestedDeptId,
    })
      .select("-password")
      .populate("department", "name code")
      .sort({ lastName: 1 });

    res.json(users);
  } catch (err) {
    console.error("Error fetching department users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/users/:id
 * @desc    Get user by ID
 * @access  Private (Self/Admin/Manager)
 */
router.get("/:id", auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/users/:id
 * @desc    Update user
 * @access  Private (Self/Admin/Manager)
 */
router.put("/:id", auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      department,
      position,
      phoneNumber,
      profileImage,
    } = req.body;

    // Build user object
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) userFields.email = email;
    if (department) userFields.department = department;
    if (position) userFields.position = position;
    if (phoneNumber) userFields.phoneNumber = phoneNumber;
    if (profileImage) userFields.profileImage = profileImage;

    // Check if user exists
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only admin/manager can change role (as per memory faa3516c)
    if (req.body.role && (req.user.isAdmin || req.user.isManager)) {
      userFields.role = req.body.role;
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/users/:id/status
 * @desc    Activate/Deactivate user
 * @access  Private (Admin/Manager only)
 */
router.put("/:id/status", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    // Check if user exists
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   DELETE api/users/:id
 * @desc    Delete user
 * @access  Private (Admin/Manager only)
 */
router.delete("/:id", auth, isManagerOrAdmin, async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove user
    await User.findByIdAndRemove(req.params.id);

    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT api/users/password
 * @desc    Update user password
 * @access  Private (Self only)
 */
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide both current and new password" });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Get user with password
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save user with new password
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/users/shift-swap-candidates
 * @desc    Get users available for shift swaps (from same department)
 * @access  Private (All authenticated users)
 */
router.get("/shift-swap-candidates", auth, async (req, res) => {
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
    console.error("Error fetching shift swap candidates:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET api/users/department/:department
 * @desc    Get users by department
 * @access  Private (All authenticated users for their own department)
 */
router.get("/department/:department", auth, async (req, res) => {
  try {
    // Check if user is requesting their own department or is a manager/admin
    const userDeptId = req.user.department.toString();
    const requestedDeptId = req.params.department;

    // Allow access if user is admin/manager or requesting their own department
    const hasAccess =
      ["admin", "manager"].includes(req.user.role) ||
      userDeptId === requestedDeptId;

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "Access denied. You can only view users from your own department.",
      });
    }

    const users = await User.find({
      department: requestedDeptId,
    })
      .select("-password")
      .sort({ lastName: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST api/users
 * @desc    Create a new user
 * @access  Private (Admin/Manager only)
 */
router.post("/", auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, position } =
      req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !position) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Role-based access control
    if (role) {
      // Only admins can create admin accounts
      if (role === "admin" && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only administrators can create admin accounts" });
      }
      // Managers can only create employees
      if (req.user.role === "manager" && role !== "employee") {
        return res
          .status(403)
          .json({ message: "Managers can only create employee accounts" });
      }
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "employee", // Default to employee if no role specified
      department, // This is now optional as per our User model change
      position,
      createdBy: req.user._id, // Add the authenticated user's ID as createdBy
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id)
      .select("-password")
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName");

    res.status(201).json(userResponse);
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
