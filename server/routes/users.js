const express = require('express');
const router = express.Router();
const { auth, isAdmin, isManagerOrAdmin, isSelfOrHigherRole } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   GET api/users
 * @desc    Get all users
 * @access  Private (Admin/Manager)
 */
router.get('/', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ lastName: 1 });
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/users/:id
 * @desc    Get user by ID
 * @access  Private (Self/Admin/Manager)
 */
router.get('/:id', auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/users/:id
 * @desc    Update user
 * @access  Private (Self/Admin/Manager)
 */
router.put('/:id', auth, isSelfOrHigherRole, async (req, res) => {
  try {
    const { firstName, lastName, email, department, position, phoneNumber, profileImage } = req.body;
    
    // Build user object
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) userFields.email = email;
    if (department) userFields.department = department;
    if (position) userFields.position = position;
    if (phoneNumber) userFields.phoneNumber = phoneNumber;
    if (profileImage) userFields.profileImage = profileImage;
    
    // Check if user exists
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only admin can change role
    if (req.body.role && req.user.role === 'admin') {
      userFields.role = req.body.role;
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/users/:id/status
 * @desc    Activate/Deactivate user
 * @access  Private (Admin only)
 */
router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Check if user exists
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user status
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Update user status error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/users/department/:department
 * @desc    Get users by department
 * @access  Private (Admin/Manager)
 */
router.get('/department/:department', auth, isManagerOrAdmin, async (req, res) => {
  try {
    const users = await User.find({ 
      department: req.params.department 
    }).select('-password').sort({ lastName: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Get users by department error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
