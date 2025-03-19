const request = require("supertest");
const app = require("./testApp");
const User = require("../models/User");
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

describe("User Model Tests", () => {
  test("should create first admin user without createdBy", async () => {
    const adminData = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
    };

    const admin = await User.create(adminData);
    expect(admin._id).toBeDefined();
    expect(admin.role).toBe("admin");
  });

  test("should require createdBy for non-first admin users", async () => {
    // Create first admin
    const firstAdmin = await User.create({
      firstName: "First",
      lastName: "Admin",
      email: "first.admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
    });

    // Try to create second admin without createdBy
    await expect(
      User.create({
        firstName: "Second",
        lastName: "Admin",
        email: "second.admin@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
      }),
    ).rejects.toThrow();

    // Should succeed with createdBy
    const secondAdmin = await User.create({
      firstName: "Second",
      lastName: "Admin",
      email: "second.admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
      createdBy: firstAdmin._id,
    });

    expect(secondAdmin._id).toBeDefined();
  });

  test("should allow admin to create any type of user", async () => {
    // Create admin first
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
    });

    // Admin creates manager
    const manager = await User.create({
      firstName: "Manager",
      lastName: "User",
      email: "manager@test.com",
      password: "Password123!",
      role: "manager",
      position: "Department Manager",
      createdBy: admin._id,
    });

    // Admin creates employee
    const employee = await User.create({
      firstName: "Employee",
      lastName: "User",
      email: "employee@test.com",
      password: "Password123!",
      role: "employee",
      position: "Software Developer",
      createdBy: admin._id,
    });

    expect(manager._id).toBeDefined();
    expect(employee._id).toBeDefined();
  });

  test("should allow manager to create only employees", async () => {
    // Create admin first
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
    });

    // Admin creates manager
    const manager = await User.create({
      firstName: "Manager",
      lastName: "User",
      email: "manager@test.com",
      password: "Password123!",
      role: "manager",
      position: "Department Manager",
      createdBy: admin._id,
    });

    // Manager creates employee (should succeed)
    const employee = await User.create({
      firstName: "Employee",
      lastName: "User",
      email: "employee@test.com",
      password: "Password123!",
      role: "employee",
      position: "Software Developer",
      createdBy: manager._id,
    });

    expect(employee._id).toBeDefined();

    // Manager tries to create admin (should fail)
    await expect(
      User.create({
        firstName: "New",
        lastName: "Admin",
        email: "new.admin@test.com",
        password: "Password123!",
        role: "admin",
        position: "System Administrator",
        createdBy: manager._id,
      }),
    ).rejects.toThrow();

    // Manager tries to create another manager (should fail)
    await expect(
      User.create({
        firstName: "New",
        lastName: "Manager",
        email: "new.manager@test.com",
        password: "Password123!",
        role: "manager",
        position: "Department Manager",
        createdBy: manager._id,
      }),
    ).rejects.toThrow();
  });

  test("should not allow employee to create users", async () => {
    // Create admin first
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
      position: "System Administrator",
    });

    // Create employee
    const employee = await User.create({
      firstName: "Employee",
      lastName: "User",
      email: "employee@test.com",
      password: "Password123!",
      role: "employee",
      position: "Software Developer",
      createdBy: admin._id,
    });

    // Employee tries to create another employee (should fail)
    await expect(
      User.create({
        firstName: "New",
        lastName: "Employee",
        email: "new.employee@test.com",
        password: "Password123!",
        role: "employee",
        position: "Software Developer",
        createdBy: employee._id,
      }),
    ).rejects.toThrow();
  });
});
