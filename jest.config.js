export default {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of file extensions your modules use
  moduleFileExtensions: ["js", "jsx", "json"],

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/__mocks__/fileMock.js",
  },

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.js",
    "<rootDir>/src/**/*.{spec,test}.js",
  ],

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/src"],

  // Setup files after env is loaded
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],

  // Transform files with babel-jest
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Coverage configuration
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/**/*.d.js"],

  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],
};
