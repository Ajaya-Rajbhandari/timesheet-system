import request from "supertest";
import { app } from "../../server/app";
import { User } from "../../models/User";

describe("Auth API Endpoints", () => {
  beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
  });

  describe("POST /api/auth/login", () => {
    test("should login user with valid credentials", async () => {
      // First create a user
      const user = await User.create({
        username: "testuser",
        password: "password123",
        email: "test@example.com",
      });

      const response = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("username", "testuser");
    });

    test("should return error for invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "wronguser",
        password: "wrongpass",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });
});
