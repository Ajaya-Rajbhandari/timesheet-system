const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Department = require('../models/Department');

const updatePasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB...');

    // First, ensure IT department exists
    let department = await Department.findOne({ code: 'IT' });
    if (!department) {
      console.log('Department not found. Please run npm run init-db first.');
      return;
    }
    console.log('Found department:', department.name);

    const testUsers = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'manager@test.com', password: 'manager123' },
      { email: 'employee@test.com', password: 'employee123' }
    ];

    for (const userData of testUsers) {
      // Find user
      const user = await User.findOne({ email: userData.email });
      if (!user) {
        console.log(`User not found: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Update password and ensure department is set
      user.password = hashedPassword;
      user.department = department._id; // Ensure department is set correctly
      await user.save();

      console.log(`Updated password for user: ${userData.email}`);
    }

    console.log('\nPassword update completed successfully!');
    console.log('\nTest Credentials (Updated):');
    console.log('------------------');
    testUsers.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Password: ${user.password}`);
    });

  } catch (error) {
    console.error('Error updating passwords:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`${key}:`, error.errors[key].message);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the update
updatePasswords(); 