const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const Department = require("../models/Department");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * @route   POST api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      position,
      employeeId,
      phoneNumber,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "department",
      "position",
      "employeeId",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    // Validate password length
    if (password.length < 6) {
      console.log("Password too short");
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if employee ID is already in use
    user = await User.findOne({ employeeId });
    if (user) {
      console.log("Employee ID already in use:", employeeId);
      return res.status(400).json({ message: "Employee ID is already in use" });
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex =
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(phoneNumber)) {
        console.log("Invalid phone number format:", phoneNumber);
        return res
          .status(400)
          .json({ message: "Please enter a valid phone number" });
      }
    }

    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      console.log("Department not found:", department);
      return res.status(400).json({ message: "Department not found" });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "employee", // Default to employee if not specified
      department,
      position,
      employeeId,
      phoneNumber,
      createdBy: req.user._id, // Set the createdBy field
    });

    // Save user to database
    await newUser.save();
    console.log("User created successfully:", newUser.email);

    // Create JWT payload
    const payload = {
      userId: newUser.id,
      role: newUser.role,
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        position: newUser.position,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Handle mongoose validation errors
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors).map(
        (error) => error.message,
      );
      return res.status(400).json({ message: validationErrors.join(", ") });
    }

    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * @route   POST api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", { email, hasPassword: !!password });

    // Validate required fields
    if (!email || !password) {
      console.log("Missing fields:", {
        hasEmail: !!email,
        hasPassword: !!password,
      });
      return res
        .status(400)
        .json({ message: "Please provide both email and password" });
    }

    // Check if user exists
    const user = await User.findOne({ email }).populate("department", "name");
    console.log("User found:", !!user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("Inactive user attempted login:", email);
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact your administrator.",
      });
    }

    // Check password for all users
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login time
    user.lastLogin = Date.now();

    // Check if createdBy is missing and set a default value if needed
    if (!user.createdBy) {
      console.log("Setting default createdBy for user:", user.email);
      // Set createdBy to the user's own ID as a fallback
      user.createdBy = user._id;
    }

    await user.save();

    // Create JWT payload
    const payload = {
      userId: user.id,
      role: user.role,
    };

    // Sign token with 24 hour expiry
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

/**
 * @route   GET api/auth/user
 * @desc    Get user data
 * @access  Private
 */
router.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error while fetching user data" });
  }
});

/**
 * @route   POST api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide both current and new password" });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

/**
 * @route   POST api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide an email address" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security reasons
    if (!user) {
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token and expiry on user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL - handle both development and production environments
    const clientURL =
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`
        : "http://localhost:3000";

    const resetUrl = `${clientURL}/reset-password/${resetToken}`;

    // Create email message
    const message = `
      You are receiving this email because you (or someone else) has requested to reset your password.
      Please click on the following link to reset your password:

      ${resetUrl}

      This link will expire in 1 hour.

      If you did not request this, please ignore this email and your password will remain unchanged.
    `;

    // HTML version of the email
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1976d2;">Timesheet System</h2>
          <h3 style="color: #333;">Password Reset Request</h3>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          You are receiving this email because you (or someone else) has requested to reset your password.
        </p>

        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Please click on the button below to reset your password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          This link will expire in <strong>1 hour</strong>.
        </p>

        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          If you did not request this, please ignore this email and your password will remain unchanged.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send email
    try {
      // Create a test account if no SMTP config is available
      // In production, you would use actual SMTP credentials
      let transporter;

      if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        // Use configured SMTP server
        console.log("Using configured SMTP server for sending email");
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      } else {
        // For development/testing, log to console instead
        console.log(
          "SMTP not configured. Would send email with reset link:",
          resetUrl,
        );
        return res.status(200).json({
          message:
            "Password reset link generated. In development mode, check server logs for the reset link.",
        });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@timesheet-system.com",
        to: user.email,
        subject: "Password Reset Request - Timesheet System",
        text: message,
        html: htmlMessage,
      });

      console.log("Password reset email sent to:", user.email);
      res.status(200).json({ message: "Password reset email sent" });
    } catch (err) {
      console.error("Email sending error:", err);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res
        .status(500)
        .json({ message: "Error sending password reset email" });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
});

/**
 * @route   GET api/auth/validate-reset-token/:token
 * @desc    Validate password reset token
 * @access  Public
 */
router.get("/validate-reset-token/:token", async (req, res) => {
  try {
    // Find user with matching token and token not expired
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }

    res.status(200).json({ message: "Token is valid" });
  } catch (err) {
    console.error("Token validation error:", err);
    res.status(500).json({ message: "Server error during token validation" });
  }
});

/**
 * @route   POST api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Find user with matching token and token not expired
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

module.exports = router;
