const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Department = require('../models/Department');
const dbHandler = require('./setup');

describe('Auth Endpoints', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clearDatabase());
  afterAll(async () => await dbHandler.closeDatabase());

  describe('POST /api/auth/register', () => {
    let department;

    beforeEach(async () => {
      department = await dbHandler.createTestDepartment(Department, User);
    });

    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'employee',
          department: department._id,
          position: 'Test Position',
          employeeId: 'EMP' + Date.now(),
          phoneNumber: '1234567890'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should not create user with existing email', async () => {
      const existingUser = await dbHandler.createTestUser(User, Department);
      const existingEmail = existingUser.email;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User 2',
          email: existingEmail,
          password: 'password123',
          role: 'employee',
          department: department._id,
          position: 'Test Position',
          employeeId: 'EMP' + Date.now(),
          phoneNumber: '1234567890'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await dbHandler.createTestUser(User, Department);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/user', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      testUser = await dbHandler.createTestUser(User, Department);
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });
      token = res.body.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', testUser.email);
    });

    it('should not get user without token', async () => {
      const res = await request(app)
        .get('/api/auth/user');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });
}); 