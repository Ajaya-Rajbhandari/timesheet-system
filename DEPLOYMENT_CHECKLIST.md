# Deployment Checklist for Timesheet System

This document outlines the steps required to properly deploy the timesheet system to a production environment, with special attention to the authentication and password reset functionality.

## Environment Configuration

### Server Environment Variables (.env)

1. **Update the CLIENT_URL**

   - Change `CLIENT_URL=https://your-production-domain.com` to your actual production domain
   - This ensures password reset links point to the correct location

2. **Configure SMTP Settings**

   - Uncomment and configure the following settings:
     ```
     SMTP_HOST=your-smtp-server.com
     SMTP_PORT=587
     SMTP_SECURE=true/false (depending on your SMTP server)
     SMTP_USER=your-email@example.com
     SMTP_PASSWORD=your-email-password
     EMAIL_FROM=noreply@your-domain.com
     ```
   - These settings are required for the password reset emails to be sent properly

3. **Verify MongoDB Connection**

   - Ensure `MONGODB_URI` points to your production MongoDB instance
   - Consider using environment variables or a secrets manager for sensitive credentials

4. **JWT Secret**
   - Generate a new, secure JWT secret for production
   - Use a strong random string generator (minimum 32 characters)

## Build Process

### Client (React App)

1. **Build the React App**

   ```bash
   cd client
   npm run build
   ```

2. **Verify Static Assets**
   - Ensure all assets are properly included in the build

### Server (Node.js)

1. **Install Production Dependencies**

   ```bash
   cd server
   npm install --production
   ```

2. **Set NODE_ENV**
   - Ensure `NODE_ENV=production` is set in your deployment environment

## Deployment Steps

1. **Database Migration**

   - If needed, run any database migrations or setup scripts

2. **User Schema Update**

   - Verify that the User model includes the reset password fields:
     - `resetPasswordToken`
     - `resetPasswordExpires`

3. **Test Password Reset Flow**
   - After deployment, test the complete password reset flow:
     1. Request password reset
     2. Check that email is received
     3. Follow link to reset password
     4. Verify new password works for login

## Security Considerations

1. **HTTPS**

   - Ensure your application is served over HTTPS
   - This is critical for secure password reset links

2. **CORS Configuration**

   - Update CORS settings in server.js to allow only your production domain

3. **Rate Limiting**

   - Consider implementing rate limiting for password reset requests to prevent abuse

4. **Email Template**
   - Consider using a more professional HTML email template for password reset emails

## Monitoring

1. **Error Logging**

   - Set up error logging for authentication and password reset failures
   - Consider using a service like Sentry or LogRocket

2. **Analytics**
   - Track password reset requests and success rates

## Post-Deployment

1. **User Communication**

   - Inform users about the new password reset functionality
   - Update any user documentation or help guides

2. **Admin Training**
   - Ensure administrators know how to help users with password reset issues

---

Remember to update this checklist as needed for your specific deployment environment and requirements.
