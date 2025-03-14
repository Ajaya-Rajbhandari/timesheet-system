const request = require("supertest");
const app = require("./testApp");
const dbHandler = require("./dbHandler");

beforeAll(async () => {
  await dbHandler.connect();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Auth Endpoints", () => {
  describe("POST /api/auth/register", () => {
    test("should create first admin user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        firstName: "Admin",
        lastName: "User",
        email: "admin@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("userId");
    });

    test("should create regular user with admin creator", async () => {
      // First create an admin user
      const adminResponse = await request(app).post("/api/auth/register").send({
        firstName: "Admin",
        lastName: "User",
        email: "admin@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      });

      const response = await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        password: "Password123!",
        role: "employee",
        position: "Software Developer",
        createdBy: adminResponse.body.userId,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("userId");
    });

    test("should not create user with existing email", async () => {
      // First create a user
      await request(app).post("/api/auth/register").send({
        firstName: "Admin",
        lastName: "User",
        email: "admin@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      });

      // Try to create another user with the same email
      const response = await request(app).post("/api/auth/register").send({
        firstName: "Another",
        lastName: "User",
        email: "admin@test.com",
        password: "Password123!",
        role: "employee",
        position: "Software Developer",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login with correct credentials", async () => {
      // First create a user
      await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      });

      // Try to login
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("email", "test@test.com");
    });

    test("should not login with incorrect password", async () => {
      // First create a user
      await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      });

      // Try to login with wrong password
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/auth/user", () => {
    test("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("role");
    });

    test("should not get user without token", async () => {
      const response = await request(app).get("/api/auth/user");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });
});
