import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import crypto from "crypto";

// Generate secure random test credentials
const generateTestCredentials = () => ({
  password: crypto.randomBytes(16).toString("hex"),
  token: crypto.randomBytes(32).toString("hex"),
  secret: crypto.randomBytes(32).toString("hex"),
});

let mongod;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Set secure test environment variables
    const testCreds = generateTestCredentials();
    process.env.TEST_PASSWORD = testCreds.password;
    process.env.JWT_SECRET = testCreds.secret;
    process.env.TEST_TOKEN = testCreds.token;
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    // Clear sensitive test environment variables
    delete process.env.TEST_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.TEST_TOKEN;

    await mongoose.disconnect();
    await mongod.stop();
  });
};
