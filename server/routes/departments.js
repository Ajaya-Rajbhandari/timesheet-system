const express = require('express');
const router = express.Router();
const { auth, isManagerOrAdmin } = require('../middleware/auth');
const Department = require('../models/Department');
const User = require('../models/User');

/**
 * @route   GET api/departments
 * @desc    Get all departments
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Server error while fetching departments' });
  }
});

/**
 * @route   GET api/departments/:id
 * @desc    Get department by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ message: 'Server error while fetching department' });
  }
});

/**
 * @route   POST api/departments
 * @desc    Create a new department
 * @access  Private (Admin only)
 */
router.post('/', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { name, code, description, manager, parentDepartment } = req.body;
    
    // Check if department with same name or code already exists
    const existingDepartment = await Department.findOne({ 
      $or: [{ name }, { code }] 
    });
    
    if (existingDepartment) {
      return res.status(400).json({ 
        message: 'Department with this name or code already exists' 
      });
    }
    
    // Check if manager exists and has appropriate role
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({ message: 'Manager not found' });
      }
      
      if (!['manager', 'admin'].includes(managerUser.role)) {
        return res.status(400).json({ 
          message: 'Department manager must have manager or admin role' 
        });
      }
    }
    
    // Create new department
    const newDepartment = new Department({
      name,
      code,
      description,
      manager,
      parentDepartment,
      createdBy: req.user.id
    });
    
    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ message: 'Server error while creating department' });
  }
});

/**
 * @route   PUT api/departments/:id
 * @desc    Update a department
 * @access  Private (Admin only)
 */
router.put('/:id', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const { name, code, description, manager, parentDepartment, isActive } = req.body;
    
    // Check if department exists
    let department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if department with same name or code already exists (excluding this one)
    if (name || code) {
      const existingDepartment = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { name: name || department.name },
          { code: code || department.code }
        ]
      });
      
      if (existingDepartment) {
        return res.status(400).json({ 
          message: 'Department with this name or code already exists' 
        });
      }
    }
    
    // Check if manager exists and has appropriate role
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({ message: 'Manager not found' });
      }
      
      if (!['manager', 'admin'].includes(managerUser.role)) {
        return res.status(400).json({ 
          message: 'Department manager must have manager or admin role' 
        });
      }
    }
    
    // Update department
    department.name = name || department.name;
    department.code = code || department.code;
    department.description = description !== undefined ? description : department.description;
    department.manager = manager || department.manager;
    department.parentDepartment = parentDepartment !== undefined ? parentDepartment : department.parentDepartment;
    department.isActive = isActive !== undefined ? isActive : department.isActive;
    department.updatedBy = req.user.id;
    
    await department.save();
    res.json(department);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ message: 'Server error while updating department' });
  }
});

/**
 * @route   DELETE api/departments/:id
 * @desc    Delete a department
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, isManagerOrAdmin, async (req, res) => {
  try {
    // Check if department exists
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if department has users
    const usersCount = await User.countDocuments({ department: req.params.id });
    
    if (usersCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with assigned users' 
      });
    }
    
    // Check if department has sub-departments
    const subDepartmentsCount = await Department.countDocuments({ 
      parentDepartment: req.params.id 
    });
    
    if (subDepartmentsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with sub-departments' 
      });
    }
    
    await department.remove();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ message: 'Server error while deleting department' });
  }
});

module.exports = router; 