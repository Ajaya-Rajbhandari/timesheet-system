/**
 * Password Validation Middleware
 *
 * Enforces password strength requirements based on configurable rules.
 */

// Password validation function
const validatePasswordStrength = (password) => {
  // Get configuration from environment variables or use defaults
  const minLength = process.env.PASSWORD_MIN_LENGTH || 8;
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE !== "false";
  const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE !== "false";
  const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS !== "false";
  const requireSpecial = process.env.PASSWORD_REQUIRE_SPECIAL !== "false";

  const errors = [];

  // Check minimum length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Check for uppercase letters
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for lowercase letters
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for numbers
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special characters
  if (
    requireSpecial &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Middleware for validating password in request body
const passwordValidator = (req, res, next) => {
  const { password } = req.body;

  // Skip validation if no password in request
  if (!password) {
    return next();
  }

  const validation = validatePasswordStrength(password);

  if (!validation.isValid) {
    return res.status(400).json({
      error: "Password does not meet security requirements",
      details: validation.errors,
    });
  }

  next();
};

module.exports = {
  passwordValidator,
  validatePasswordStrength,
};
