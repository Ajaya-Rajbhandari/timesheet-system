const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

let mongod;
let managerCounter = 0;
let userCounter = 0;
let departmentCounter = 0;

// Load test environment variables
dotenv.config({
  path: path.join(__dirname, ".env.test"),
});

// Set required environment variables if not set
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/timesheet-test";

// Set recommended environment variables if not set
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "test-refresh-token-secret";
process.env.PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS || "10";
process.env.RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || "900000";
process.env.RATE_LIMIT_MAX_REQUESTS =
  process.env.RATE_LIMIT_MAX_REQUESTS || "100";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.ENABLE_AUDIT_LOGS = process.env.ENABLE_AUDIT_LOGS || "false";

// Set security environment variables if not set
process.env.PASSWORD_MIN_LENGTH = process.env.PASSWORD_MIN_LENGTH || "8";
process.env.PASSWORD_REQUIRE_UPPERCASE =
  process.env.PASSWORD_REQUIRE_UPPERCASE || "true";
process.env.PASSWORD_REQUIRE_LOWERCASE =
  process.env.PASSWORD_REQUIRE_LOWERCASE || "true";
process.env.PASSWORD_REQUIRE_NUMBERS =
  process.env.PASSWORD_REQUIRE_NUMBERS || "true";
process.env.PASSWORD_REQUIRE_SPECIAL =
  process.env.PASSWORD_REQUIRE_SPECIAL || "true";
process.env.MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS || "5";
process.env.LOCKOUT_DURATION = process.env.LOCKOUT_DURATION || "900000";

// Connect to the in-memory database
module.exports.connect = async () => {
  // Close existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
};

// Clear all test data after every test
module.exports.clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
  // Reset counters
  managerCounter = 0;
  userCounter = 0;
  departmentCounter = 0;
};

// Remove and close the db and server
module.exports.closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
};

// Create test manager user without department
module.exports.createTestManager = async (User, userData = {}) => {
  managerCounter++;
  const defaultManager = {
    firstName: "Manager",
    lastName: "Test",
    email: `manager${managerCounter}@example.com`,
    password: "password123",
    role: "manager",
    position: "Department Manager",
    employeeId: "MGR" + Date.now() + managerCounter,
    phoneNumber: "1234567890",
    isActive: true,
  };

  // Use save() instead of create() to bypass schema validation temporarily
  const manager = new User({ ...defaultManager, ...userData });
  return await manager.save({ validateBeforeSave: false });
};

// Create an admin user
module.exports.createAdminUser = async (User) => {
  const adminUser = new User({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "adminpass123",
    role: "admin",
    employeeId: "ADMIN001",
    phoneNumber: "1234567890",
    position: "System Administrator",
    createdBy: undefined, // First admin doesn't need createdBy
  });
  return await adminUser.save();
};

// Create a test department
module.exports.createTestDepartment = async (Department, User) => {
  departmentCounter++;
  const admin = await this.createAdminUser(User);

  const department = new Department({
    name: `Test Department ${departmentCounter}`,
    description: "Test department description",
    createdBy: admin._id,
  });

  return await department.save();
};

// Create a test user
module.exports.createTestUser = async (User, Department, role = "employee") => {
  userCounter++;
  const admin = await this.createAdminUser(User);
  const department = await this.createTestDepartment(Department, User);

  const user = new User({
    firstName: `Test${userCounter}`,
    lastName: "User",
    email: `testuser${userCounter}@example.com`,
    password: "password123",
    role: role,
    department: department._id,
    position: role === "manager" ? "Department Manager" : "Test Position",
    employeeId: `EMP${userCounter}`,
    phoneNumber: "1234567890",
    createdBy: admin._id,
  });

  return await user.save();
};

// Create test schedule
module.exports.createTestSchedule = async (
  Schedule,
  userId,
  scheduleData = {},
) => {
  const defaultSchedule = {
    userId,
    type: "regular",
    startTime: "09:00",
    endTime: "17:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    date: new Date(),
  };

  return await Schedule.create({ ...defaultSchedule, ...scheduleData });
};
