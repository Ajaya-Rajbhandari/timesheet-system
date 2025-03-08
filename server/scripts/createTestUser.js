const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create test users
const createTestUsers = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (!adminExists) {
      // Create admin user
      const adminSalt = await bcrypt.genSalt(10);
      const adminHashedPassword = await bcrypt.hash('admin123', adminSalt);
      
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: adminHashedPassword,
        role: 'admin',
        department: 'Management',
        position: 'System Administrator',
        employeeId: 'A001',
        phoneNumber: '123-456-7890',
        isActive: true,
        createdAt: Date.now()
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if employee user already exists
    const employeeExists = await User.findOne({ email: 'employee@test.com' });
    if (!employeeExists) {
      // Create employee user
      const employeeSalt = await bcrypt.genSalt(10);
      const employeeHashedPassword = await bcrypt.hash('employee123', employeeSalt);
      
      const employee = new User({
        firstName: 'Test',
        lastName: 'Employee',
        email: 'employee@test.com',
        password: employeeHashedPassword,
        role: 'employee',
        department: 'Engineering',
        position: 'Software Developer',
        employeeId: 'E001',
        phoneNumber: '123-456-7891',
        isActive: true,
        createdAt: Date.now()
      });
      
      await employee.save();
      console.log('Employee user created successfully');
    } else {
      console.log('Employee user already exists');
    }
    
    // Check if manager user already exists
    const managerExists = await User.findOne({ email: 'manager@test.com' });
    if (!managerExists) {
      // Create manager user
      const managerSalt = await bcrypt.genSalt(10);
      const managerHashedPassword = await bcrypt.hash('manager123', managerSalt);
      
      const manager = new User({
        firstName: 'Test',
        lastName: 'Manager',
        email: 'manager@test.com',
        password: managerHashedPassword,
        role: 'manager',
        department: 'Engineering',
        position: 'Engineering Manager',
        employeeId: 'M001',
        phoneNumber: '123-456-7892',
        isActive: true,
        createdAt: Date.now()
      });
      
      await manager.save();
      console.log('Manager user created successfully');
    } else {
      console.log('Manager user already exists');
    }
    
    // Check if test user already exists
    const existingTestUser = await User.findOne({ email: 'testuser@example.com' });
    if (!existingTestUser) {
      // Create test user
      const testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123', // Use a simple password for testing
        role: 'admin',
        employeeId: 'EMP001',
        position: 'Manager',
        department: 'HR'
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      testUser.password = await bcrypt.hash(testUser.password, salt); // Hash the password

      // Save user to database
      await testUser.save();
      console.log('Test user created successfully!');
    } else {
      console.log('Test user already exists, skipping creation.');
    }
    
    console.log('Test users creation completed');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
};

createTestUsers();
