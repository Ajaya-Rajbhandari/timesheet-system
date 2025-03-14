const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const User = require("../models/User");

// Rate limiting for authentication attempts
const authLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW
    ? parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000
    : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    : 100,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to authenticate JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Invalid token format",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token expiration explicitly
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          error: "Token expired",
          message: "Please log in again",
        });
      }

      // Get user and exclude sensitive fields
      const user = await User.findById(decoded.userId).select(
        "-password -resetPasswordToken -resetPasswordExpires",
      );

      if (!user) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "User not found",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "User account is inactive",
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired",
          message: "Please log in again",
        });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token",
          message: "Authentication failed",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).json({
      error: "Authentication failed",
      message: "Internal server error",
    });
  }
};

// Middleware to check if user can create/manage users
const canManageUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // As per memory faa3516c, only admins/managers can create users
  if (!req.user.isAdmin && !req.user.isManager) {
    return res.status(403).json({
      message:
        "Access denied. Only administrators and managers can manage users.",
    });
  }

  next();
};

// Middleware to check manager or admin role
const isManagerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Insufficient permissions",
      });
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error.message);
    return res.status(500).json({
      error: "Authorization failed",
      message: "Internal server error",
    });
  }
};

// Middleware to check if user is accessing their own data or has higher role
const isSelfOrHigherRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const targetUserId = req.params.id || req.body.userId || req.params.userId;

  // Allow access if:
  // 1. User is admin/manager (as per memory 0a76e4df), or
  // 2. User is accessing their own data
  if (
    req.user.isAdmin ||
    req.user.isManager ||
    req.user._id.toString() === targetUserId
  ) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied. You can only access your own data." });
  }
};

// Middleware to check if user can access reports
const canAccessReports = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
    }

    // Allow users to access their own reports
    const requestedUserId = req.params.userId || req.query.userId;
    if (
      requestedUserId &&
      req.user.role === "employee" &&
      req.user._id.toString() !== requestedUserId
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own reports",
      });
    }

    next();
  } catch (error) {
    console.error("Report access error:", error.message);
    return res.status(500).json({
      error: "Authorization failed",
      message: "Internal server error",
    });
  }
};

module.exports = {
  auth,
  authLimiter,
  canManageUsers,
  isManagerOrAdmin,
  isSelfOrHigherRole,
  canAccessReports,
};
