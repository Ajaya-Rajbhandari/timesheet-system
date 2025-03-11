# Timesheet System

[![CI](https://github.com/Ajaya-Rajbhandari/timesheet-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Ajaya-Rajbhandari/timesheet-system/actions/workflows/ci.yml)

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
- User profile management with profile picture upload
- Password reset and account recovery

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

## Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your own values:
   - Generate a secure JWT_SECRET
   - Update MONGODB_URI if using a different database
   - Update other values as needed

4. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

5. Start the development servers:
   ```bash
   # Start server (from server directory)
   npm run dev

   # Start client (from client directory)
   npm start
   ```

## Security Notes

- Never commit `.env` files to the repository
- Keep your JWT_SECRET secure and unique for each environment
- Regularly rotate sensitive credentials
- Use environment variables for all sensitive configuration

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
