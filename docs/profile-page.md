# Profile Page Documentation

## Overview

The Profile Page feature allows users to view and edit their personal information, manage emergency contacts, change their password, and upload a profile picture. This feature enhances the user experience by providing a centralized location for users to manage their account information.

## Features

### Personal Information Management

- View personal details including name, email, phone number, position, and department
- Edit personal information (name, email, phone number)
- Role-based access control (certain fields like role and department are read-only)

### Emergency Contact Management

- Add or update emergency contact information
- Store emergency contact name, relationship, and phone number

### Security Management

- Change password with current password verification
- Password strength validation
- Secure password storage with bcrypt hashing

### Profile Picture Management

- Upload a custom profile picture
- Preview image before confirming upload
- Automatic resizing and optimization
- Default profile picture for users without a custom image

## Technical Implementation

### Frontend Components

- **Profile.js**: Main profile page component with tabbed interface
- **ImageUpload.js**: Reusable component for profile picture uploads

### Backend API Endpoints

#### User Information

- `GET /api/users/:id`: Fetch user information
- `PUT /api/users/:id`: Update user information
- `PUT /api/users/password`: Update user password

#### Profile Image

- `POST /api/upload/profile`: Upload profile image
- `GET /api/upload/profile/:filename`: Retrieve profile image

### Security Considerations

- All profile updates require authentication
- Password changes require current password verification
- File uploads are validated for type (images only) and size (max 5MB)
- Previous profile images are automatically deleted when replaced

## User Flow

1. User navigates to the Profile page from the header menu
2. User can view their information across three tabs:
   - Personal Information
   - Emergency Contact
   - Security
3. User can edit information by clicking the "Edit" button
4. User can upload a profile picture by clicking on their avatar
5. Changes are saved to the database and reflected immediately in the UI

## Dependencies

- Material-UI for UI components
- Multer for file upload handling
- Bcrypt for password hashing
- Moment.js for date formatting

## Future Enhancements

- Profile image cropping functionality
- Additional profile fields (social media links, bio, etc.)
- Profile visibility settings
- Activity log/history of profile changes
