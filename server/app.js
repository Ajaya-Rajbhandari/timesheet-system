const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const validateEnv = require("./utils/validateEnv");
const { auditLogger } = require("./middleware/auditLogger");
const securityHeaders = require("./middleware/securityHeaders");
const profileRoutes = require("./routes/profileRoutes");

// Load environment variables
dotenv.config();
validateEnv();

const app = express();
app.set("trust proxy", 1); // Enable trust proxy since we're behind nginx

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: false,
    frameguard: false,
    hsts: false,
    ieNoOpen: false,
    noSniff: false,
    referrerPolicy: false,
    xssFilter: false,
  }),
);
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving - Move this up before routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Audit logging
app.use(auditLogger);

// Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/schedules", require("./routes/schedules"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/timeoff", require("./routes/timeoff"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/shift-swap", require("./routes/shiftSwap"));
app.use("/api/profile", profileRoutes);
app.use("/api/upload", require("./routes/upload"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

module.exports = app;
