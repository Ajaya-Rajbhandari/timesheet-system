const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set user and role information
    req.user = user;
    req.user.isAdmin = user.role === 'admin';
    req.user.isManager = user.role === 'manager';
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check user roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
  };
};

// Middleware to check manager or admin role
const isManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // As per memory 0a76e4df, only managers and admins can create/edit schedules
  if (!req.user.isAdmin && !req.user.isManager) {
    return res.status(403).json({ message: 'Access denied. Only managers and administrators can perform this action.' });
  }

  next();
};

// Middleware to check if user is accessing their own data or has higher role
const isSelfOrHigherRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const targetUserId = req.params.userId || req.body.userId;
  
  // Allow access if:
  // 1. User is admin/manager (as per memory 0a76e4df), or
  // 2. User is accessing their own data
  if (req.user.isAdmin || req.user.isManager || req.user._id.toString() === targetUserId) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. You can only access your own data.' });
  }
};

module.exports = {
  auth,
  checkRole,
  isManagerOrAdmin,
  isSelfOrHigherRole
};
