import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../server/app";
import User from "../../models/User";
import { generateToken } from "../../utils/tokenUtils";
import { setupTestDB } from "../utils/testSetup";

setupTestDB();

describe("Auth API", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "employee",
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/login", () => {
    let hashedPassword;

    beforeEach(async () => {
      if (!process.env.TEST_PASSWORD) {
        throw new Error("TEST_PASSWORD environment variable not set");
      }
      hashedPassword = await User.hashPassword(process.env.TEST_PASSWORD);
      await User.create({ ...testUser, password: hashedPassword });
    });

    test("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: testUser.username,
        password: process.env.TEST_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        username: testUser.username,
        email: testUser.email,
      });
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("should return error for invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: testUser.username,
        password: "invalid-password-attempt",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const newUser = {
        username: "newuser",
        password: "password123",
        email: "new@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.username).toBe(newUser.username);
    });

    test("should prevent duplicate username registration", async () => {
      // Create initial user
      await User.create({
        username: "existinguser",
        password: await User.hashPassword("password123"),
        email: "existing@example.com",
      });

      // Try to register with same username
      const response = await request(app).post("/api/auth/register").send({
        username: "existinguser",
        password: "password123",
        email: "another@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    test("should prevent duplicate email registration", async () => {
      // Create initial user
      await User.create({
        username: "user1",
        password: await User.hashPassword("password123"),
        email: "duplicate@example.com",
      });

      // Try to register with same email
      const response = await request(app).post("/api/auth/register").send({
        username: "user2",
        password: "password123",
        email: "duplicate@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/users/create", () => {
    let adminToken;
    let managerToken;

    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        username: "admin",
        password: await User.hashPassword("password123"),
        email: "admin@example.com",
        role: "admin",
        createdBy: "system",
      });
      adminToken = generateToken(admin);

      // Create manager user
      const manager = await User.create({
        username: "manager",
        password: await User.hashPassword("password123"),
        email: "manager@example.com",
        role: "manager",
        createdBy: admin._id,
      });
      managerToken = generateToken(manager);
    });

    test("admin should create any type of user", async () => {
      const newUser = {
        username: "newmanager",
        password: "password123",
        email: "newmanager@example.com",
        role: "manager",
      };

      const response = await request(app)
        .post("/api/users/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.username).toBe(newUser.username);
      expect(response.body.user.role).toBe("manager");
    });

    test("manager should only create employee users", async () => {
      const newEmployee = {
        username: "newemployee",
        password: "password123",
        email: "employee@example.com",
        role: "employee",
      };

      const response = await request(app)
        .post("/api/users/create")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(newEmployee);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("employee");
    });

    test("manager cannot create admin or manager users", async () => {
      const newManager = {
        username: "anothermanager",
        password: "password123",
        email: "another@example.com",
        role: "manager",
      };

      const response = await request(app)
        .post("/api/users/create")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(newManager);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });

    test("should prevent duplicate username", async () => {
      const existingUser = {
        username: "existing",
        password: "password123",
        email: "existing@example.com",
        role: "employee",
      };

      await request(app)
        .post("/api/users/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(existingUser);

      const response = await request(app)
        .post("/api/users/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...existingUser,
          email: "another@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Protected Routes", () => {
    let authToken;
    let user;

    beforeEach(async () => {
      if (!process.env.TEST_PASSWORD) {
        throw new Error("TEST_PASSWORD environment variable not set");
      }
      const hashedPassword = await User.hashPassword(process.env.TEST_PASSWORD);
      user = await User.create({ ...testUser, password: hashedPassword });
      authToken = generateToken(user);
    });

    test("should access protected route with valid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username: testUser.username,
        email: testUser.email,
      });
      expect(response.body).not.toHaveProperty("password");
    });

    test("should reject access without token", async () => {
      const response = await request(app).get("/api/users/profile");

      expect(response.status).toBe(401);
    });
  });
});
