/**
 * Audit Logger Middleware
 *
 * Records security-related events for compliance and monitoring.
 */

const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

// Configure log directory
const LOG_DIR = process.env.AUDIT_LOG_DIR || "logs";
const AUDIT_LOG_FILE = path.join(LOG_DIR, "audit.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SECURITY: "SECURITY",
};

/**
 * Write to audit log file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
const writeToAuditLog = (level, message, data = {}) => {
  if (process.env.ENABLE_AUDIT_LOGS !== "true") {
    return;
  }

  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };

  // Remove sensitive data
  if (logEntry.password) logEntry.password = "[REDACTED]";
  if (logEntry.token) logEntry.token = "[REDACTED]";
  if (logEntry.jwt) logEntry.jwt = "[REDACTED]";
  if (logEntry.authorization) logEntry.authorization = "[REDACTED]";

  // Append to log file
  fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(logEntry) + "\n", {
    encoding: "utf8",
  });
};

/**
 * Audit logger for authentication events
 */
const auditAuthEvents = (req, res, next) => {
  // Store original end method
  const originalEnd = res.end;

  // Get request details
  const requestData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent") || "Unknown",
    userId: req.user ? req.user._id : "unauthenticated",
  };

  // Track authentication attempts
  if (req.originalUrl.includes("/api/auth/login")) {
    writeToAuditLog(LOG_LEVELS.SECURITY, "Authentication attempt", {
      ...requestData,
      username: req.body.username,
      // Don't log the password!
    });
  }

  // Override end method to capture response
  res.end = function (chunk, encoding) {
    // Restore original end method
    res.end = originalEnd;

    // Call original end method
    res.end(chunk, encoding);

    // Log based on response status
    if (req.originalUrl.includes("/api/auth/")) {
      const logLevel =
        res.statusCode >= 400 ? LOG_LEVELS.WARNING : LOG_LEVELS.INFO;
      const eventType = res.statusCode >= 400 ? "failed" : "successful";

      let eventName;
      if (req.originalUrl.includes("/login")) {
        eventName = "Authentication";
      } else if (req.originalUrl.includes("/register")) {
        eventName = "Registration";
      } else if (req.originalUrl.includes("/logout")) {
        eventName = "Logout";
      } else if (req.originalUrl.includes("/reset-password")) {
        eventName = "Password reset";
      } else {
        eventName = "Auth operation";
      }

      writeToAuditLog(logLevel, `${eventName} ${eventType}`, {
        ...requestData,
        statusCode: res.statusCode,
        responseTime: Date.now() - req._startTime,
      });
    }
  };

  // Store request start time
  req._startTime = Date.now();

  next();
};

const auditLogger = (req, res, next) => {
  if (process.env.ENABLE_AUDIT_LOGS === "true") {
    const event = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user ? req.user.id : null,
    };

    // Log the event (in production, this would write to a secure audit log)
    console.log("[AUDIT]", JSON.stringify(event));
  }
  next();
};

module.exports = {
  auditAuthEvents,
  writeToAuditLog,
  LOG_LEVELS,
  auditLogger,
};
