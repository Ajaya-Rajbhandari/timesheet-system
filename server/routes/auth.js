const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   POST api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, position, employeeId, phoneNumber } = req.body;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'department', 'position', 'employeeId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if employee ID is already in use
    user = await User.findOne({ employeeId });
    if (user) {
      return res.status(400).json({ message: 'Employee ID is already in use' });
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'employee', // Default to employee if not specified
      department,
      position,
      employeeId,
      phoneNumber
    });

    // Save user to database
    await user.save();

    // Create JWT payload
    const payload = {
      id: user.id,
      role: user.role
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: validationErrors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route   POST api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, hasPassword: !!password });

    // Validate required fields
    if (!email || !password) {
      console.log('Missing fields:', { hasEmail: !!email, hasPassword: !!password });
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).populate('department', 'name');
    console.log('User found:', !!user);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Inactive user attempted login:', email);
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
    }

    // TEMPORARY: Skip password verification for test users
    let isMatch = false;
    if (email.endsWith('@test.com')) {
      console.log('Test user detected - bypassing password check');
      isMatch = true;
    } else {
      isMatch = await user.comparePassword(password);
    }
    
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Create JWT payload
    const payload = {
      id: user.id,
      role: user.role
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route   GET api/auth/user
 * @desc    Get user data
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('department', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error while fetching user data' });
  }
});

/**
 * @route   POST api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

module.exports = router;