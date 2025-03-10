/**
 * Initialize All Script
 * 
 * This script runs all initialization scripts in sequence.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('=== Starting Database Initialization ===');

try {
  // Run initDb.js first to create users
  console.log('\n=== Initializing Users ===');
  execSync('node scripts/initDb.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  
  // Run initDepartments.js to create departments
  console.log('\n=== Initializing Departments ===');
  execSync('node scripts/initDepartments.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  
  console.log('\n=== Database Initialization Complete ===');
} catch (error) {
  console.error('\n=== Initialization Failed ===');
  console.error(error.message);
  process.exit(1);
} 