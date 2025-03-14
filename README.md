# Timesheet System

A modern timesheet management system built with Node.js, Express, MongoDB, and React. This system allows organizations to track employee work hours, projects, and tasks efficiently.

## Project Overview

This is a full-stack web application designed for time tracking and management. It follows a RESTful architecture and uses modern JavaScript practices including ES6+ features, async/await patterns, and modular design.

### Type of Application

- **Architecture**: REST API + Single Page Application (SPA)
- **Deployment Model**: Web-based
- **User Interface**: React-based SPA
- **Backend**: Node.js API Server
- **Database**: MongoDB (Document Store)
- **Authentication**: Token-based (JWT)

### Core Functionalities

1. **User Management**

   - Secure authentication
   - User session handling
   - Password encryption

2. **Time Tracking**

   - Daily timesheet entries
   - Project-based tracking
   - Task categorization
   - Hours validation

3. **Data Management**
   - CRUD operations for timesheets
   - Data persistence with MongoDB
   - Input validation
   - Error handling

## Detailed Technology Stack

### Frontend Technologies

- **React**: ^18.2.0 (UI Library)
- **React DOM**: ^18.2.0 (DOM Manipulation)
- **Modern JavaScript**: ES6+ features
- **CSS**: Modern CSS with flexbox/grid

### Backend Technologies

- **Node.js**: Runtime environment
- **Express**: ^4.17.1 (Web Framework)
- **MongoDB**: Database (via Mongoose)
- **Mongoose**: ^6.0.0 (MongoDB ODM)
- **JSON Web Tokens**: ^8.5.1 (Authentication)
- **bcrypt**: Password hashing

### Development & Testing

- **Jest**: ^29.3.1 (Testing Framework)
- **Supertest**: ^6.3.3 (HTTP Testing)
- **Babel**: ^7.22.0 (JavaScript Compiler)
  - @babel/core
  - @babel/preset-env
  - @babel/preset-react
- **Testing Libraries**:
  - @testing-library/jest-dom: ^5.16.5
  - @testing-library/react: ^13.4.0
  - @testing-library/user-event: ^14.4.3

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control
- **npm**: Package management

### Testing Environment

- **mongodb-memory-server**: ^8.12.0 (In-memory MongoDB for testing)
- **jest-environment-jsdom**: ^29.3.1 (DOM environment for testing)

## Features

- User Authentication
- Timesheet Entry Management
- Hours Validation
- Project and Task Tracking

## Project Structure

```
timesheet-system/
├── src/
│   ├── models/          # Database models
│   │   ├── User.js      # User model with authentication
│   │   └── Timesheet.js # Timesheet entry model
│   ├── server/          # Server configuration
│   │   └── app.js       # Express application setup
│   ├── utils/           # Utility functions
│   │   ├── auth.js      # Authentication utilities
│   │   └── tokenUtils.js# Token generation utilities
│   └── __tests__/       # Test files
│       └── api/         # API tests
│           ├── auth.test.js    # Authentication tests
│           └── timesheet.test.js# Timesheet API tests
```

## API Endpoints

### Authentication

#### POST /api/auth/login

- Login with username and password
- Returns JWT token and user information

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Timesheet Management

#### POST /api/timesheet

- Create a new timesheet entry
- Requires authentication token
- Validates hours (0-24)

```json
{
  "userId": "user_id",
  "date": "2024-01-15",
  "hours": 8,
  "project": "Project A",
  "task": "Development"
}
```

#### GET /api/timesheet

- Retrieve timesheet entries
- Requires authentication token

## Models

### User Model

```javascript
{
  username: String (required, unique),
  password: String (required),
  email: String (required, unique)
}
```

### Timesheet Model

```javascript
{
  userId: String (required),
  date: String (required),
  hours: Number (required, min: 0, max: 24),
  project: String (required),
  task: String (required)
}
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (if needed)
4. Run tests:
   ```bash
   npm run test:backend    # Run backend tests
   ```

## Testing

The project uses Jest for testing with the following commands:

- `npm run test` - Run all tests
- `npm run test:backend` - Run backend tests only
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Test Coverage

Current test coverage:

- Models: 100%
- Utils: 100%
- Server: 85.18%

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Input validation for all endpoints
- Secure password comparison

## Development Guidelines

1. All new features should include tests
2. Maintain test coverage above 80%
3. Follow existing code structure
4. Use async/await for asynchronous operations
5. Validate all input data

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 201: Resource created
- 400: Bad request
- 401: Unauthorized
- 404: Not found

## Future Improvements

1. Add user registration endpoint
2. Implement role-based access control
3. Add date range filtering for timesheet entries
4. Implement reporting features
5. Add input validation middleware
