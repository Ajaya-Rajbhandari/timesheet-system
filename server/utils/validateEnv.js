/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set
 * and provides warnings for recommended but optional variables.
 */

const validateEnv = () => {
  const requiredVars = ["JWT_SECRET", "MONGODB_URI", "NODE_ENV"];

  const recommendedVars = [
    "JWT_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "PASSWORD_SALT_ROUNDS",
    "RATE_LIMIT_WINDOW",
    "RATE_LIMIT_MAX_REQUESTS",
    "CORS_ORIGIN",
    "ENABLE_AUDIT_LOGS",
  ];

  const securityVars = [
    "PASSWORD_MIN_LENGTH",
    "PASSWORD_REQUIRE_UPPERCASE",
    "PASSWORD_REQUIRE_LOWERCASE",
    "PASSWORD_REQUIRE_NUMBERS",
    "PASSWORD_REQUIRE_SPECIAL",
    "MAX_LOGIN_ATTEMPTS",
    "LOCKOUT_DURATION",
  ];

  // Check for missing required variables
  const missingRequired = requiredVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingRequired.length > 0) {
    console.error("ERROR: Missing required environment variables:");
    missingRequired.forEach((varName) => {
      console.error(`  - ${varName}`);
    });

    // Exit if in production, otherwise just warn
    if (process.env.NODE_ENV === "production") {
      console.error(
        "Application cannot start without required environment variables in production mode.",
      );
      process.exit(1);
    } else {
      console.error(
        "WARNING: Application may not function correctly without these variables.",
      );
    }
  }

  // Check for missing recommended variables
  const missingRecommended = recommendedVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingRecommended.length > 0) {
    console.warn("WARNING: Missing recommended environment variables:");
    missingRecommended.forEach((varName) => {
      console.warn(`  - ${varName}`);
    });
  }

  // Check security variables
  const missingSecurityVars = securityVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingSecurityVars.length > 0) {
    console.warn(
      "SECURITY WARNING: Missing security-related environment variables:",
    );
    missingSecurityVars.forEach((varName) => {
      console.warn(`  - ${varName}`);
    });
  }

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      "SECURITY WARNING: JWT_SECRET is too short. It should be at least 32 characters long.",
    );
  }

  // Check password salt rounds
  if (
    process.env.PASSWORD_SALT_ROUNDS &&
    parseInt(process.env.PASSWORD_SALT_ROUNDS) < 10
  ) {
    console.warn(
      "SECURITY WARNING: PASSWORD_SALT_ROUNDS is too low. It should be at least 10.",
    );
  }

  // Validate JWT expiry
  if (process.env.JWT_EXPIRY && !process.env.JWT_EXPIRY.match(/^\d+[smhd]$/)) {
    console.warn(
      "WARNING: JWT_EXPIRY format is invalid. It should be a number followed by s, m, h, or d (e.g., 1h).",
    );
  }

  console.log("Environment validation completed.");
};

module.exports = validateEnv;
