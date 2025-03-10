const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
require('dotenv').config();

async function initializeDb() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany({});
        await Department.deleteMany({});

        // First create a temporary admin user without department
        const tempAdminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@test.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            employeeId: 'ADMIN001',
            position: 'System Administrator'
        });
        // Save without validation to bypass department requirement temporarily
        const adminUser = await tempAdminUser.save({ validateBeforeSave: false });
        console.log('- Temporary Admin User created:', adminUser.email);

        // Create IT Department with the admin as manager
        const itDepartment = await Department.create({
            name: 'IT Department',
            code: 'IT',
            description: 'Information Technology Department',
            manager: adminUser._id
        });
        console.log('- IT Department created:', itDepartment.name);

        // Update admin user with department
        adminUser.department = itDepartment._id;
        await adminUser.save();
        console.log('- Admin User updated with department');

        // Create Manager User
        const managerUser = await User.create({
            firstName: 'Manager',
            lastName: 'User',
            email: 'manager@test.com',
            password: await bcrypt.hash('manager123', 10),
            role: 'manager',
            employeeId: 'MGR001',
            position: 'IT Manager',
            department: itDepartment._id
        });
        console.log('- Manager User created:', managerUser.email);

        // Create Employee User
        const employeeUser = await User.create({
            firstName: 'Employee',
            lastName: 'User',
            email: 'employee@test.com',
            password: await bcrypt.hash('employee123', 10),
            role: 'employee',
            employeeId: 'EMP001',
            position: 'Software Developer',
            department: itDepartment._id
        });
        console.log('- Employee User created:', employeeUser.email);

        console.log('Database initialized successfully!');

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

initializeDb(); 