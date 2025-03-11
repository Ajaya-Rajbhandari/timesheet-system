# Security Documentation for Timesheet System

## Recent Security Incident and Resolution (March 11, 2025)

### Security Alert

On March 10th, 2025, GitGuardian detected exposed secrets in the GitHub repository. The following sensitive information was committed to the public repository:

- MongoDB connection string with username and password
- JWT secret key used for authentication
- SMTP password for email functionality

### Resolution Steps Taken

#### 1. Removed Sensitive Data from Git History

We used the BFG Repo-Cleaner tool to remove the sensitive data from the Git history:

```bash
# Downloaded BFG tool
curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Created a file with the sensitive data to be replaced
# (passwords.txt containing the sensitive strings)

# Ran BFG to replace the sensitive data
java -jar bfg.jar --replace-text passwords.txt

# Cleaned up and pushed the changes
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Deleted the passwords.txt file
del passwords.txt
```

#### 2. Rotated All Compromised Credentials

**MongoDB Password:**
- Changed the password in MongoDB Atlas Database Access
- Updated the connection string in the .env file

**JWT Secret:**
- Generated a new secure random string using Node.js crypto module
- Updated the JWT_SECRET in the .env file

**SMTP Password:**
- Generated a new Gmail app password
- Updated the SMTP_PASSWORD in the .env file

#### 3. Improved Security Configuration

- Updated .gitignore to properly exclude .env files
- Created .env.example template without actual secrets
- Added comprehensive security documentation

#### 4. Verified System Functionality

- Restarted the server with new credentials
- Confirmed successful MongoDB connection
- Tested authentication flow with new JWT secret
- Verified email functionality with new SMTP password

## Addressing the Exposed Secrets Issue

### What Happened

GitGuardian detected exposed secrets in your GitHub repository. The following sensitive information was committed to your public repository:

- MongoDB connection string with username and password
- JWT secret key used for authentication
- SMTP password for email functionality

### Immediate Steps to Take

#### 1. Rotate All Compromised Credentials

**MongoDB Password:**
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to Database Access > Edit the user
3. Reset the password to a new secure value
4. Update your local .env file with the new connection string

**JWT Secret:**
1. Generate a new secure random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update your local .env file with this new value

**SMTP Password:**
1. Go to your Gmail account > Security > App passwords
2. Delete the existing app password
3. Generate a new app password
4. Update your local .env file with the new password

#### 2. Remove Sensitive Data from Git History

Use the BFG Repo-Cleaner to remove sensitive data from your git history:

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with the sensitive data to be replaced
echo "hexY440ztbzpvOYp" > passwords.txt
echo "6161f428f66e3f611d74e8ce9db49c5866af3ce3026c07fe21992785f75933db" >> passwords.txt
echo "bitb nasm xgfz weby" >> passwords.txt

# Run BFG to replace the sensitive data
java -jar bfg.jar --replace-text passwords.txt

# Clean up and push the changes
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Delete the passwords.txt file
rm passwords.txt
```

## Preventing Future Security Issues

### Environment Variables Best Practices

1. **Never commit .env files to version control**
   - We've updated your .gitignore to exclude .env files
   - Use .env.example to document required variables without actual values

2. **Use different .env files for different environments**
   - .env.development for local development
   - .env.test for testing
   - .env.production for production

3. **Limit access to production credentials**
   - Only share production credentials with team members who need them
   - Consider using a secrets management service for production

### Secure JWT Implementation

1. **JWT Secret Management**
   - Always use a strong, randomly generated secret
   - Rotate the secret periodically (e.g., every 90 days)
   - Consider using environment-specific secrets

2. **Token Security**
   - Set appropriate expiration times (we currently use 24 hours)
   - Consider implementing token refresh mechanism
   - Validate tokens on every request

### Role-Based Access Control

As per your existing security model:

1. **User Creation**
   - Only administrators and managers can create new users
   - Public signup has been removed

2. **Schedule Management**
   - Only managers and administrators can create or edit schedules
   - Regular employees can only view their own schedules

### Regular Security Audits

1. **Code Reviews**
   - Implement mandatory code reviews before merging to main branches
   - Use automated tools to scan for security issues

2. **Dependency Scanning**
   - Regularly update dependencies to patch security vulnerabilities
   - Use tools like npm audit to identify vulnerable dependencies

3. **Secret Scanning**
   - Consider using pre-commit hooks to prevent committing secrets
   - Set up GitGuardian or similar tools for continuous monitoring

## Verifying Security After Changes

After rotating credentials and implementing security improvements:

1. **Test Authentication Flow**
   - Verify that users can log in successfully
   - Confirm that role-based access control works correctly
   - Test password reset functionality

2. **Check API Security**
   - Verify that unauthenticated requests are properly rejected
   - Confirm that users can only access authorized resources

3. **Monitor for Unusual Activity**
   - Watch application logs for unusual authentication attempts
   - Monitor database access patterns

## Security Contacts

If you discover a security vulnerability, please report it by:

- Opening a confidential issue in your repository
- Contacting the security team at [your-security-email@example.com]

## Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
