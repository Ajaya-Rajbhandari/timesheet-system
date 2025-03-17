# Timesheet System Authentication Documentation

## Recent Security Updates (March 11, 2025)

### Authentication Security Improvements

We recently addressed several critical authentication security issues:

1. **Fixed Token Header Format**

   - Issue: The server expected the token in the `x-auth-token` header, but the client was sending it as `Authorization: Bearer ${token}`
   - Fix: Updated the axios configuration in `client/src/utils/axios.js` to use the correct header format

2. **Corrected JWT Payload Structure**

   - Issue: The auth middleware was looking for `userId` in the token payload, but the login route was using `id`
   - Fix: Updated the auth.js route to use `userId` in the payload to ensure consistency

3. **Rotated JWT Secret**

   - Issue: The JWT secret was exposed in the Git repository
   - Fix: Generated a new secure random string and updated the JWT_SECRET in the .env file

4. **Verified Authentication Flow**
   - Tested the login functionality with the new JWT secret
   - Confirmed that role-based access control works correctly
   - Ensured that only managers and administrators can create/edit schedules
   - Verified that only admins/managers can create users

## Overview

This document outlines the authentication system implemented in the Timesheet System application, including recent fixes and security considerations. The system uses JSON Web Tokens (JWT) for authentication and implements role-based access control to restrict certain actions to specific user roles.

## Authentication Flow

1. **User Login**: User provides email and password to the `/api/auth/login` endpoint
2. **Server Validation**: Server validates credentials and generates a JWT token
3. **Token Storage**: Token is stored in the client's localStorage
4. **Request Authentication**: Token is included in the `x-auth-token` header for all subsequent API requests
5. **Server Verification**: Server middleware verifies the token and extracts user information
6. **Role-Based Access**: Server enforces role-based access control based on the user's role

## Recent Fixes

### 1. Token Header Format

**Issue**: The server expected the token in the `x-auth-token` header, but the client was sending it as `Authorization: Bearer ${token}`.

**Fix**: Updated the axios configuration in `client/src/utils/axios.js` to use the correct header format:

```javascript
// Before
config.headers["Authorization"] = `Bearer ${token}`;

// After
config.headers["x-auth-token"] = token;
```

### 2. JWT Payload Structure

**Issue**: The auth middleware was looking for `userId` in the token payload, but the login route was using `id`.

**Fix**: Updated the auth.js route to use `userId` in the payload to ensure consistency:

```javascript
// Before
const payload = {
  id: user.id,
  role: user.role,
};

// After
const payload = {
  userId: user.id,
  role: user.role,
};
```

### 3. Auth Middleware Updates

**Issue**: The auth middleware needed improvements to properly handle role-based access control.

**Fix**: Updated the auth middleware to:

- Properly check admin and manager roles
- Add role flags to req.user object
- Improve error messages for role-based access control
- Add proper validation in isSelfOrHigherRole middleware

```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set user and role information
    req.user = user;
    req.user.isAdmin = user.role === "admin";
    req.user.isManager = user.role === "manager";

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
```

## Security Model

### Role-Based Access Control

The system implements a role-based access control model with three primary roles:

1. **Admin**: Full system access, can manage all users and data
2. **Manager**: Can manage employees, schedules, and approve requests
3. **Employee**: Limited access to own data and schedules

### Access Control Middleware

The following middleware functions enforce role-based access control:

1. **isManagerOrAdmin**: Restricts access to managers and administrators only

   - Used for creating/editing schedules, managing departments, etc.

2. **isSelfOrHigherRole**: Allows users to access their own data or managers/admins to access any user's data
   - Used for profile management, viewing schedules, etc.

### Security Considerations

1. **Token Storage**: Tokens are stored in localStorage, which is vulnerable to XSS attacks. Consider implementing additional security measures like token refresh or HTTP-only cookies for production environments.

2. **Password Handling**: Passwords are hashed using bcrypt before storage. Never store plaintext passwords.

3. **Error Messages**: Generic error messages are used to prevent information leakage.

4. **Token Expiration**: Tokens expire after 24 hours, requiring users to log in again.

## Client-Side Implementation

### AuthContext

The `AuthContext.js` file manages authentication state and provides login/logout functionality to the application:

```javascript
const login = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    const { token, user } = response.data;

    // Set auth state
    setAuthState({
      token,
      user,
      isAuthenticated: true,
    });

    // Set local storage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Set axios headers
    axiosInstance.defaults.headers.common["x-auth-token"] = token;

    return true;
  } catch (err) {
    console.error("Login error:", err.response?.data?.message || err.message);
    return false;
  }
};
```

### Axios Configuration

The `axios.js` file configures the axios instance to include the authentication token in all requests:

```javascript
// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
```

## Best Practices

1. **Consistent Token Handling**: Ensure consistent token format between client and server
2. **Role Validation**: Always validate user roles on the server side, never trust client-side role information
3. **Error Handling**: Implement proper error handling for authentication failures
4. **Token Refresh**: Consider implementing token refresh for long user sessions
5. **Secure Headers**: Use secure headers like HSTS, Content-Security-Policy, etc.
6. **Regular Audits**: Regularly audit authentication and authorization code for security vulnerabilities

## Future Improvements

1. Implement token refresh mechanism
2. Add two-factor authentication for admin accounts
3. Implement rate limiting for login attempts
4. Add more detailed audit logging for security events
5. Consider moving to HTTP-only cookies for token storage

## Conclusion

The authentication system now properly handles user authentication and role-based access control. The fixes ensure that users remain logged in across sessions and that proper security controls are in place to restrict access based on user roles. Regular maintenance and security reviews are recommended to keep the system secure.
