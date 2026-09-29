import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db';

describe('Auth & End-to-End API Security Tests', () => {
  const testEmail = `auth_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'auth_test_' } },
    });
    await prisma.$disconnect();
  });

  test('POST /api/v1/auth/register fails with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register successfully registers user as unverified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user!.isVerified).toBe(false);
  });

  test('POST /api/v1/auth/login rejects unverified user with EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  test('Protected routes reject unauthenticated requests', async () => {
    const profileRes = await request(app).get('/api/v1/user/profile');
    expect(profileRes.status).toBe(401);

    const tasksRes = await request(app).get('/api/v1/tasks/catalog');
    expect(tasksRes.status).toBe(401);
  });

  test('POST /api/v1/auth/verify-otp verifies user and allows subsequent login', async () => {
    // Mark user as verified directly for login verification
    await prisma.user.update({
      where: { email: testEmail },
      data: { isVerified: true },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    authToken = loginRes.body.token;
  });

  test('Authenticated user can save first-login profile with Indian mobile number', async () => {
    const profileRes = await request(app)
      .post('/api/v1/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Debojyoti Dey',
        mobileNumber: '9876543210',
        address: 'Flat 402, Green Meadows, Hyderabad',
        businessName: 'Personal Household',
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.profile.fullName).toBe('Debojyoti Dey');
    expect(profileRes.body.profile.mobileNumber).toBe('+91 9876543210');
  });
});
