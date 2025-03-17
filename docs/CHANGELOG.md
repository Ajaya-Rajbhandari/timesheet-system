# Changelog

All notable changes to the Timesheet System will be documented in this file.

## [Unreleased]

## [1.2.0] - 2025-03-11

### Added

- User profile page with tabbed interface for managing personal information
- Profile picture upload functionality with image preview
- Emergency contact management
- Password change functionality with current password verification
- Server-side file upload handling with Multer
- Profile image display in application header

### Changed

- Updated Layout component to display user profile image
- Enhanced user service with password update functionality

### Security

- Implemented secure file upload validation
- Added password strength requirements
- Ensured proper authentication for all profile operations

## [1.1.0] - 2025-02-15

### Added

- Password reset functionality with email verification
- Email-based account recovery system
- Professional HTML email templates for reset instructions

### Changed

- Modified authentication flow to restrict user creation to admins/managers only
- Improved error handling in authentication process

### Security

- Implemented token-based verification for password resets
- Enhanced password storage security

## [1.0.0] - 2025-01-10

### Added

- Initial release of the Timesheet System
- Employee time tracking with clock in/out functionality
- Attendance monitoring and management
- Schedule management and shift planning
- Reporting and analytics
- Role-based access control
- Time-off request system
