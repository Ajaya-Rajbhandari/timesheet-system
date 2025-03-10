const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let managerCounter = 0;
let userCounter = 0;
let departmentCounter = 0;

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
    firstName: 'Manager',
    lastName: 'Test',
    email: `manager${managerCounter}@example.com`,
    password: 'password123',
    role: 'manager',
    position: 'Department Manager',
    employeeId: 'MGR' + Date.now() + managerCounter,
    phoneNumber: '1234567890',
    isActive: true
  };

  // Use save() instead of create() to bypass schema validation temporarily
  const manager = new User({ ...defaultManager, ...userData });
  return await manager.save({ validateBeforeSave: false });
};

// Create test department with manager
module.exports.createTestDepartment = async (Department, User) => {
  departmentCounter++;
  // Create a manager first
  const manager = await this.createTestManager(User);
  
  const department = await Department.create({
    name: `Test Department ${departmentCounter}`,
    description: `Test Department ${departmentCounter} Description`,
    code: `TEST-${String(departmentCounter).padStart(3, '0')}`,
    manager: manager._id
  });

  // Update manager with department
  await User.findByIdAndUpdate(manager._id, { department: department._id });

  return department;
};

// Create test user
module.exports.createTestUser = async (User, Department, userData = {}) => {
  userCounter++;
  // Create a test department first (which includes creating a manager)
  const department = await this.createTestDepartment(Department, User);
  
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${userCounter}@example.com`,
    password: 'password123',
    role: 'employee',
    department: department._id,
    position: 'Test Position',
    employeeId: 'EMP' + Date.now() + userCounter,
    phoneNumber: '1234567890',
    isActive: true
  };

  return await User.create({ ...defaultUser, ...userData });
};

// Create test schedule
module.exports.createTestSchedule = async (Schedule, userId, scheduleData = {}) => {
  const defaultSchedule = {
    userId,
    type: 'regular',
    startTime: '09:00',
    endTime: '17:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    date: new Date()
  };

  return await Schedule.create({ ...defaultSchedule, ...scheduleData });
}; 