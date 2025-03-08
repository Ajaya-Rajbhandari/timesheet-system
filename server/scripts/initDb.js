const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Department = require('../models/Department');
const User = require('../models/User');

const initializeDb = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB...');

    // First, create admin user if doesn't exist
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      position: 'System Administrator',
      employeeId: 'ADM001'
    };

    let adminUser = await User.findOne({ email: adminData.email });
    if (!adminUser) {
      adminUser = await User.create(adminData);
      console.log('Created admin user:', adminUser.email);
    } else {
      console.log('Admin user already exists');
    }

    // Then create department with admin as manager
    let department = await Department.findOne({ code: 'IT' });
    if (!department) {
      department = await Department.create({
        name: 'Information Technology',
        code: 'IT',
        description: 'IT Department',
        location: {
          building: 'Main Building',
          floor: '3rd Floor',
          room: '304'
        },
        defaultWorkingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC'
        },
        manager: adminUser._id  // Set admin as manager
      });
      console.log('Default department created:', department.name);
    }

    // Update admin user with department
    adminUser.department = department._id;
    await adminUser.save();

    // Create other test users
    const otherUsers = [
      {
        firstName: 'Test',
        lastName: 'Manager',
        email: 'manager@test.com',
        password: 'manager123',
        role: 'manager',
        department: department._id,
        position: 'Engineering Manager',
        employeeId: 'MGR001'
      },
      {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'employee@test.com',
        password: 'employee123',
        role: 'employee',
        department: department._id,
        position: 'Software Developer',
        employeeId: 'EMP001'
      }
    ];

    // Create remaining users if they don't exist
    for (const userData of otherUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }

    console.log('\nDatabase initialization completed successfully!');
    console.log('\nTest Credentials:');
    console.log('------------------');
    console.log('\nADMIN User:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    
    otherUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()} User:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
    });

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the initialization
initializeDb(); 