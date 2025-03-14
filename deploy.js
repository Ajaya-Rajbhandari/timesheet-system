/**
 * Deployment script for Timesheet System
 *
 * This script builds the React frontend and prepares the application for production.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  clientDir: path.join(__dirname, "client"),
  serverDir: path.join(__dirname, "server"),
  buildDir: path.join(__dirname, "client", "build"),
  serverPublicDir: path.join(__dirname, "server", "public"),
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

/**
 * Execute a command and log the output
 * @param {string} command - Command to execute
 * @param {string} workingDir - Working directory
 */
function executeCommand(command, workingDir) {
  console.log(
    `${colors.bright}${colors.cyan}Executing:${colors.reset} ${command}`,
  );
  try {
    execSync(command, {
      cwd: workingDir,
      stdio: "inherit",
    });
    console.log(
      `${colors.green}✓ Command completed successfully${colors.reset}`,
    );
  } catch (error) {
    console.error(
      `${colors.red}✗ Command failed: ${error.message}${colors.reset}`,
    );
    process.exit(1);
  }
}

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`${colors.yellow}Creating directory: ${dir}${colors.reset}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  ensureDirectoryExists(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main deployment process
console.log(
  `${colors.bright}${colors.cyan}=== Starting Deployment Process ===${colors.reset}`,
);

// Step 1: Install dependencies
console.log(
  `\n${colors.bright}${colors.cyan}=== Installing Dependencies ===${colors.reset}`,
);
executeCommand("npm install", config.clientDir);
executeCommand("npm install", config.serverDir);

// Step 2: Build React frontend
console.log(
  `\n${colors.bright}${colors.cyan}=== Building React Frontend ===${colors.reset}`,
);
executeCommand("npm run build", config.clientDir);

// Step 3: Copy build files to server public directory
console.log(
  `\n${colors.bright}${colors.cyan}=== Copying Build Files to Server ===${colors.reset}`,
);
ensureDirectoryExists(config.serverPublicDir);
copyDirectory(config.buildDir, config.serverPublicDir);

// Step 4: Create production .env file if it doesn't exist
const envFilePath = path.join(config.serverDir, ".env.production");
if (!fs.existsSync(envFilePath)) {
  console.log(
    `\n${colors.bright}${colors.cyan}=== Creating Production .env File ===${colors.reset}`,
  );
  const envContent = `NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
`;
  fs.writeFileSync(envFilePath, envContent);
  console.log(
    `${colors.yellow}Created .env.production file. Please update with your production values.${colors.reset}`,
  );
}

console.log(
  `\n${colors.bright}${colors.green}=== Deployment Preparation Complete ===${colors.reset}`,
);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(
  `1. Update the ${colors.bright}server/.env.production${colors.reset} file with your production values`,
);
console.log(`2. Deploy the application to your production server`);
console.log(
  `3. Start the server with ${colors.bright}NODE_ENV=production node server/server.js${colors.reset}`,
);
