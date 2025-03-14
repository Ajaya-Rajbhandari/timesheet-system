import express from "express";
import mongoose from "mongoose";
import Timesheet from "../models/Timesheet";
import User from "../models/User";
import { generateToken } from "../utils/tokenUtils";

const app = express();

app.use(express.json());

// Timesheet routes
app.post("/api/timesheet", async (req, res) => {
  try {
    const { hours } = req.body;
    if (hours < 0 || hours > 24) {
      return res.status(400).json({ error: "Hours must be between 0 and 24" });
    }
    const timesheet = await Timesheet.create(req.body);
    res.status(201).json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/timesheet", async (req, res) => {
  try {
    const entries = await Timesheet.find();
    res.status(200).json(entries);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin/Manager routes
app.post("/api/users/create", async (req, res) => {
  try {
    // Get the admin/manager's ID from the token
    const adminId = req.user.id; // This will be set by auth middleware
    const adminUser = await User.findById(adminId);

    // Check if user has permission to create users
    if (!["admin", "manager"].includes(adminUser.role)) {
      return res.status(403).json({
        error: "Only admins and managers can create users",
      });
    }

    const { username, password, email, role } = req.body;

    // Managers can only create employees
    if (adminUser.role === "manager" && role !== "employee") {
      return res.status(403).json({
        error: "Managers can only create employee accounts",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await User.hashPassword(password);

    // Create new user
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      role,
      createdBy: adminId,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default app;
