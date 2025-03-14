import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../server/app";
import Timesheet from "../../models/Timesheet";
import { generateToken } from "../../utils/auth";

// No need to set jest.setTimeout here as it's in the jest.backend.config.js file

describe("Timesheet API", () => {
  const testUser = {
    _id: "507f1f77bcf86cd799439011",
    username: "testuser",
  };

  const authToken = generateToken(testUser);

  // No need for beforeEach to clean DB - it's handled in setupTestsBackend.js

  describe("POST /api/timesheet", () => {
    test("should create new timesheet entry", async () => {
      const entry = {
        userId: testUser._id,
        date: "2024-01-15",
        hours: 8,
        project: "Project A",
        task: "Development",
      };

      const response = await request(app)
        .post("/api/timesheet")
        .set("Authorization", `Bearer ${authToken}`)
        .send(entry);

      expect(response.status).toBe(201);
      expect(response.body.date).toBe(entry.date);
      expect(response.body.hours).toBe(entry.hours);
    });

    test("should validate hours input", async () => {
      const entry = {
        userId: testUser._id,
        date: "2024-01-15",
        hours: 25, // Invalid hours
        project: "Project A",
        task: "Development",
      };

      const response = await request(app)
        .post("/api/timesheet")
        .set("Authorization", `Bearer ${authToken}`)
        .send(entry);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/timesheet", () => {
    test("should get user timesheet entries", async () => {
      // Create test entries
      await Timesheet.create([
        {
          userId: testUser._id,
          date: "2024-01-15",
          hours: 8,
          project: "Project A",
          task: "Development",
        },
        {
          userId: testUser._id,
          date: "2024-01-16",
          hours: 7,
          project: "Project B",
          task: "Testing",
        },
      ]);

      const response = await request(app)
        .get("/api/timesheet")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].hours).toBe(8);
      expect(response.body[1].hours).toBe(7);
    });
  });
});
