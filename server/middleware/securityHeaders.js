/**
 * Security Headers Middleware
 *
 * This middleware adds important security headers to all responses
 * to protect against common web vulnerabilities.
 */

const securityHeaders = (req, res, next) => {
  // HSTS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'",
  );

  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Feature-Policy
  res.setHeader(
    "Feature-Policy",
    "camera 'none'; microphone 'none'; geolocation 'none'",
  );

  // Permissions-Policy - Limits browser features
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  );

  // Cache-Control - Prevents caching of sensitive information
  if (req.path.includes("/api/auth/") || req.path.includes("/api/users/")) {
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  // Prevent browser from detecting content type
  res.setHeader("X-Download-Options", "noopen");

  // Prevent browser from rendering page in different modes
  res.setHeader("X-DNS-Prefetch-Control", "off");

  next();
};

module.exports = securityHeaders;
