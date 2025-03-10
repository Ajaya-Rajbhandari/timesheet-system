/**
 * Initialize Departments Script
 * 
 * This script creates default departments in the database.
 * Run this script after setting up the database connection.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Default departments to create
const defaultDepartments = [
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'IT department responsible for technology infrastructure and support'
  },
  {
    name: 'Human Resources',
    code: 'HR',
    description: 'HR department responsible for personnel management'
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Finance department responsible for financial operations'
  },
  {
    name: 'Operations',
    code: 'OPS',
    description: 'Operations department responsible for day-to-day business operations'
  },
  {
    name: 'Sales',
    code: 'SALES',
    description: 'Sales department responsible for revenue generation'
  }
];

// Create departments
const initDepartments = async () => {
  try {
    // Check if departments already exist
    const existingDepartments = await Department.find();
    
    if (existingDepartments.length > 0) {
      console.log(`${existingDepartments.length} departments already exist in the database.`);
      
      // List existing departments
      existingDepartments.forEach(dept => {
        console.log(`- ${dept.name} (${dept.code})`);
      });
      
      // Ask if user wants to continue
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Do you want to create additional default departments? (y/n) ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await createDepartments();
        }
        
        readline.close();
        mongoose.disconnect();
      });
    } else {
      await createDepartments();
      mongoose.disconnect();
    }
  } catch (err) {
    console.error('Error initializing departments:', err);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Create departments function
const createDepartments = async () => {
  try {
    // Find admin user to set as manager
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating departments without managers.');
    } else {
      console.log(`Using admin user ${adminUser.email} as default manager.`);
    }
    
    // Create departments
    for (const dept of defaultDepartments) {
      // Check if department already exists
      const existingDept = await Department.findOne({ 
        $or: [{ name: dept.name }, { code: dept.code }] 
      });
      
      if (existingDept) {
        console.log(`Department ${dept.name} (${dept.code}) already exists. Skipping.`);
        continue;
      }
      
      // Create new department
      const newDept = new Department({
        name: dept.name,
        code: dept.code,
        description: dept.description,
        manager: adminUser ? adminUser._id : null,
        isActive: true
      });
      
      await newDept.save();
      console.log(`Created department: ${dept.name} (${dept.code})`);
    }
    
    console.log('Department initialization complete.');
  } catch (err) {
    console.error('Error creating departments:', err);
    throw err;
  }
};

// Run the initialization
initDepartments(); 