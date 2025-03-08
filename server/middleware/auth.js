const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Log token format for debugging
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { userId: decoded.id, role: decoded.role });
    
    // Add user from payload
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found for token:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      console.log('Inactive user attempted access:', decoded.id);
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check user roles
exports.checkRole = (roles) => {
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

// Middleware to check admin role
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required' });
  }
};

// Middleware to check manager or admin role
exports.isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Manager or Admin role required' });
  }
};

// Middleware to check if user is accessing their own data or is an admin/manager
exports.isSelfOrHigherRole = (req, res, next) => {
  const userId = req.params.userId || req.params.id;
  
  if (
    req.user && (
      req.user._id.toString() === userId ||
      req.user.role === 'admin' ||
      req.user.role === 'manager'
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. You can only access your own data' });
  }
};
