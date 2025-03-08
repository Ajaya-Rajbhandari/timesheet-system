# Timesheet and Attendance Management System

A modern web-based timesheet and attendance management system built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Employee time tracking with clock in/out functionality
- Real-time attendance monitoring and management
- Schedule management and shift planning
- Comprehensive reporting and analytics
- Role-based access control (Admin, Manager, Employee)
- Time-off request system
- Break time tracking
- Overtime calculation
- Mobile-responsive design

## Tech Stack

- **Frontend**: React.js, Material UI
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Cloud**: Ready for deployment on AWS/Azure

## Project Structure

```
timesheet-system/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── context/        # Context providers
│       ├── services/       # API services
│       └── utils/          # Utility functions
└── server/                 # Node.js backend
    ├── middleware/         # Express middleware
    ├── models/             # Mongoose models
    ├── routes/             # API routes
    └── server.js           # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd timesheet-system
   ```

2. Install server dependencies
   ```
   cd server
   npm install
   ```

3. Install client dependencies
   ```
   cd ../client
   npm install
   ```

4. Set up environment variables
   - Create a `.env` file in the server directory
   - Add the following variables:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/timesheet-system
     JWT_SECRET=your_jwt_secret_key_here
     NODE_ENV=development
     ```

### Running the Application

1. Start the server
   ```
   cd server
   npm run server
   ```

2. Start the client
   ```
   cd ../client
   npm start
   ```

3. For concurrent development (both client and server)
   ```
   cd server
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin/Manager)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/status` - Activate/Deactivate user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `PUT /api/attendance/clock-out` - Clock out
- `POST /api/attendance/break/start` - Start break
- `PUT /api/attendance/break/end` - End break
- `GET /api/attendance/current` - Get current attendance status
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/user/:userId` - Get user attendance (Admin/Manager)

### Schedules
- `POST /api/schedules` - Create schedule (Admin/Manager)
- `GET /api/schedules` - Get all schedules (Admin/Manager)
- `GET /api/schedules/my-schedule` - Get current user's schedule
- `GET /api/schedules/:id` - Get schedule by ID
- `PUT /api/schedules/:id` - Update schedule (Admin/Manager)
- `DELETE /api/schedules/:id` - Delete schedule (Admin/Manager)

### Time Off
- `POST /api/timeoff` - Create time-off request
- `GET /api/timeoff/my-requests` - Get current user's time-off requests
- `GET /api/timeoff/:id` - Get time-off request by ID
- `PUT /api/timeoff/:id` - Update time-off request (if pending)
- `PUT /api/timeoff/:id/status` - Approve/reject time-off request (Admin/Manager)
- `PUT /api/timeoff/:id/cancel` - Cancel time-off request

### Reports
- `GET /api/reports/attendance-summary` - Get attendance summary report
- `GET /api/reports/overtime` - Get overtime report
- `GET /api/reports/time-off` - Get time-off report
- `GET /api/reports/department-summary` - Get department summary report
- `GET /api/reports/user-details/:userId` - Get detailed user report

## Security

- JWT authentication for secure API access
- Password hashing with bcrypt
- Role-based access control
- Data encryption for sensitive information

## License

This project is licensed under the ISC License.
