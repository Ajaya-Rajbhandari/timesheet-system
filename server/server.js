const mongoose = require("mongoose");
const dotenv = require("dotenv");
const validateEnv = require("./utils/validateEnv");

// Import models
require("./models/User");
require("./models/Department");
require("./models/TimeOff");
require("./models/Attendance");
require("./models/Schedule");

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Import the configured app
const app = require("./app");

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB (only if not in test environment)
    if (process.env.NODE_ENV !== "test") {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB successfully");


      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });

      // Handle server shutdown gracefully
      process.on("SIGTERM", async () => {
        console.log("SIGTERM signal received. Shutting down gracefully...");
        await server.close();
        console.log("Server closed");
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });

      process.on("SIGINT", async () => {
        console.log("SIGINT signal received. Shutting down gracefully...");
        await server.close();
        console.log("Server closed");
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    }
  } catch (error) {
    console.error("Failed to start server due to database connection error:", error);

    process.exit(1);
  }
};

// Start the server only if this file is being run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
