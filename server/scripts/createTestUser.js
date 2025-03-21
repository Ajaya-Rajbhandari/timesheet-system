const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Department = require("../models/Department");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Create test users
const createTestUsers = async () => {
  try {
    // Get department references first
    const itDept = await Department.findOne({ code: "IT" });
    const hrDept = await Department.findOne({ code: "HR" });

    if (!itDept || !hrDept) {
      console.error(
        "Required departments not found. Please ensure departments are initialized",
      );
      process.exit(1);
    }

    // Create or get admin user first
    let adminUser;
    const adminExists = await User.findOne({ email: "admin@test.com" });
    if (!adminExists) {
      const adminSalt = await bcrypt.genSalt(10);
      const adminHashedPassword = await bcrypt.hash("admin123", adminSalt);

      adminUser = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@test.com",
        password: adminHashedPassword,
        role: "admin",
        department: itDept._id,
        position: "System Administrator",
        employeeId: "A001",
        phoneNumber: "123-456-7890",
        isActive: true,
        createdAt: Date.now(),
      });

      await adminUser.save();
      console.log("Admin user created successfully");
    } else {
      adminUser = adminExists;
      console.log("Admin user already exists");
    }

    // Check if employee user already exists
    const employeeExists = await User.findOne({ email: "employee@test.com" });
    if (!employeeExists) {
      // Create employee user
      const employeeSalt = await bcrypt.genSalt(10);
      const employeeHashedPassword = await bcrypt.hash(
        "employee123",
        employeeSalt,
      );

      const employee = new User({
        createdBy: adminUser._id,
        firstName: "Test",
        lastName: "Employee",
        email: "employee@test.com",
        password: employeeHashedPassword,
        role: "employee",
        department: hrDept._id,
        position: "Software Developer",
        employeeId: "E001",
        phoneNumber: "123-456-7891",
        isActive: true,
        createdAt: Date.now(),
      });

      await employee.save();
      console.log("Employee user created successfully");
    } else {
      console.log("Employee user already exists");
    }

    // Check if manager user already exists
    const managerExists = await User.findOne({ email: "manager@test.com" });
    if (!managerExists) {
      // Create manager user
      const managerSalt = await bcrypt.genSalt(10);
      const managerHashedPassword = await bcrypt.hash(
        "manager123",
        managerSalt,
      );

      const manager = new User({
        createdBy: adminUser._id,
        firstName: "Test",
        lastName: "Manager",
        email: "manager@test.com",
        password: managerHashedPassword,
        role: "manager",
        department: hrDept._id,
        position: "Engineering Manager",
        employeeId: "M001",
        phoneNumber: "123-456-7892",
        isActive: true,
        createdAt: Date.now(),
      });

      await manager.save();
      console.log("Manager user created successfully");
    } else {
      console.log("Manager user already exists");
    }

    // Check if test user already exists
    const existingTestUser = await User.findOne({
      email: "testuser@example.com",
    });
    if (!existingTestUser) {
      // Create test user
      const testUser = new User({
        createdBy: adminUser._id,
        firstName: "Test",
        lastName: "User",
        email: "testuser@example.com",
        password: "password123", // Use a simple password for testing
        role: "admin",
        employeeId: "EMP001",
        position: "Manager",
        department: hrDept._id,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      testUser.password = await bcrypt.hash(testUser.password, salt); // Hash the password

      // Save user to database
      await testUser.save();
      console.log("Test user created successfully!");
    } else {
      console.log("Test user already exists, skipping creation.");
    }

    console.log("Test users creation completed");
    process.exit(0);
  } catch (err) {
    console.error("Error creating test users:", err);
    process.exit(1);
  }
};

createTestUsers();
