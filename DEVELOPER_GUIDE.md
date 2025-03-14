# Timesheet System - Developer Guide

## Core Architecture

### Database Schema

#### 1. User Model

```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  email: String (required, unique),
  role: Enum["admin", "manager", "employee"],
  createdBy: ObjectId (ref: "User"),
  department: String,
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Timesheet Model

```javascript
{
  userId: ObjectId (ref: "User", required),
  date: Date (required),
  hours: Number (required, min: 0, max: 24),
  project: String (required),
  task: String (required),
  description: String,
  status: Enum["pending", "approved", "rejected"],
  approvedBy: ObjectId (ref: "User"),
  approvedAt: Date,
  comments: [{
    userId: ObjectId,
    comment: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Authentication Flow

1. **Login Process**

```javascript
// 1. Receive credentials
POST /api/auth/login { username, password }

// 2. Validate user
const user = await User.findOne({ username })
if (!user || !await user.comparePassword(password)) {
  return 401
}

// 3. Generate JWT
const token = generateToken({
  id: user._id,
  role: user.role,
  username: user.username
})

// 4. Return response
return {
  token,
  user: {
    username,
    role,
    email
  }
}
```

2. **Authorization Middleware**

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error();

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
```

### Role-Based Access Control (RBAC)

#### Permission Matrix

```javascript
const permissions = {
  admin: {
    users: ["create", "read", "update", "delete"],
    timesheets: ["create", "read", "update", "delete", "approve"],
    reports: ["generate", "export"],
    settings: ["modify"],
  },
  manager: {
    users: ["create:employee", "read", "update:employee"],
    timesheets: ["read", "approve"],
    reports: ["generate:team"],
  },
  employee: {
    timesheets: ["create:own", "read:own", "update:own"],
    profile: ["read:own", "update:own"],
  },
};
```

#### Permission Middleware

```javascript
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const allowed = permissions[userRole][resource]?.includes(action);
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
```

### API Response Standards

#### Success Responses

```javascript
// 200 OK - Successful request
{
  success: true,
  data: {}, // Response data
  message: "Operation successful"
}

// 201 Created - Resource created
{
  success: true,
  data: {}, // Created resource
  message: "Resource created successfully"
}
```

#### Error Responses

```javascript
// 400 Bad Request
{
  success: false,
  error: "Validation error",
  details: [] // Validation details
}

// 401 Unauthorized
{
  success: false,
  error: "Authentication required"
}

// 403 Forbidden
{
  success: false,
  error: "Insufficient permissions"
}
```

### Data Validation Rules

#### User Validation

```javascript
const userValidation = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  password: {
    minLength: 8,
    requirements: {
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    },
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};
```

#### Timesheet Validation

```javascript
const timesheetValidation = {
  hours: {
    min: 0,
    max: 24,
    type: "number",
  },
  date: {
    notFuture: true,
    maxPast: "30 days",
  },
  project: {
    required: true,
    minLength: 1,
  },
  task: {
    required: true,
    minLength: 1,
  },
};
```

### Testing Strategy

#### 1. Unit Tests

- Model methods
- Utility functions
- Validation rules

#### 2. Integration Tests

- API endpoints
- Authentication flow
- Permission checks

#### 3. Test Data Setup

```javascript
// Base test user
const testUser = {
  username: "testuser",
  password: "Password123!",
  email: "test@example.com",
  role: "employee",
};

// Test timesheet entry
const testTimesheet = {
  date: new Date(),
  hours: 8,
  project: "Test Project",
  task: "Development",
  description: "Test task",
};
```

### Error Handling

#### Global Error Handler

```javascript
app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: error.details,
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});
```

### Security Implementation

#### 1. Password Hashing

```javascript
// Using bcrypt with salt rounds
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};
```

#### 2. JWT Configuration

```javascript
const jwtConfig = {
  expiresIn: "24h",
  algorithm: "HS256",
  issuer: "timesheet-system",
};
```

### Audit Trail Implementation

```javascript
const auditSchema = {
  userId: ObjectId,
  action: String,
  resource: String,
  details: Object,
  timestamp: Date,
  ip: String,
};

const createAudit = (req, action, details) => {
  return Audit.create({
    userId: req.user.id,
    action,
    details,
    ip: req.ip,
    timestamp: new Date(),
  });
};
```

## Development Workflow

### 1. Code Organization

```
src/
├── models/          # Database models
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── utils/           # Helper functions
├── config/          # Configuration files
├── routes/          # API routes
└── tests/           # Test files
```

### 2. Git Workflow

- Main branch: production
- Develop branch: staging
- Feature branches: feature/[feature-name]
- Hotfix branches: hotfix/[fix-name]

### 3. Commit Message Format

```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

## Deployment Considerations

### Environment Variables

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/timesheet
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Production Checklist

1. Security headers
2. Rate limiting
3. Error logging
4. Performance monitoring
5. Database indexing
6. API documentation
