import jwt from "jsonwebtoken";

export function generateToken(user) {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "1h",
  });
}
