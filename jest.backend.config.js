export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  testEnvironment: "node", // Use Node environment for backend tests
  testMatch: ["**/src/__tests__/api/**/*.js", "**/src/__tests__/utils/**/*.js"],
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTestsBackend.js"], // Use the backend-specific setup file
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testTimeout: 15000, // Increase the global timeout for all tests
};
