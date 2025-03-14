const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("./testApp");
const dbHandler = require("./dbHandler");
const multer = require("multer");
const express = require("express");

// Configure multer for file uploads in test app
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/profile-images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, "test-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
});

// Add multer middleware to test app
app.use("/api/users/profile/upload", upload.single("profileImage"));

let testImagePath;
let testTextPath;
let testLargeImagePath;

beforeAll(async () => {
  await dbHandler.connect();

  // Create test directories if they don't exist
  const uploadDir = path.join(__dirname, "../uploads/profile-images");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create test files
  testImagePath = path.join(__dirname, "test-image.jpg");
  const imageBuffer = Buffer.alloc(1024); // 1KB test image
  fs.writeFileSync(testImagePath, imageBuffer);

  testTextPath = path.join(__dirname, "test-file.txt");
  fs.writeFileSync(testTextPath, "test content");

  testLargeImagePath = path.join(__dirname, "large-image.jpg");
  const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB file (exceeds 2MB limit)
  fs.writeFileSync(testLargeImagePath, largeBuffer);
});

afterEach(async () => {
  await dbHandler.clearDatabase();
  // Clean up uploaded files
  const uploadDir = path.join(__dirname, "../uploads/profile-images");
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    files.forEach((file) => {
      if (file !== "default-profile.png") {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    });
  }
});

afterAll(async () => {
  await dbHandler.closeDatabase();
  // Clean up test files
  [testImagePath, testTextPath, testLargeImagePath].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
});

describe("Profile Upload Tests", () => {
  test("should upload profile image successfully", async () => {
    const response = await request(app)
      .post("/api/users/profile/upload")
      .set("Authorization", "Bearer test-token")
      .attach("profileImage", testImagePath);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Profile image uploaded successfully");
    expect(response.body.profileImage).toBeDefined();
  });

  test("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .post("/api/users/profile/upload")
      .attach("profileImage", testImagePath);

    expect(response.status).toBe(401);
  });

  test("should return 400 if no file is provided", async () => {
    const response = await request(app)
      .post("/api/users/profile/upload")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("No file uploaded");
  });

  test("should return 400 for invalid file type", async () => {
    const response = await request(app)
      .post("/api/users/profile/upload")
      .set("Authorization", "Bearer test-token")
      .attach("profileImage", testTextPath);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid file type");
  });

  test("should return 400 for file size exceeding limit", async () => {
    const response = await request(app)
      .post("/api/users/profile/upload")
      .set("Authorization", "Bearer test-token")
      .attach("profileImage", testLargeImagePath);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("File too large");
  });
});
