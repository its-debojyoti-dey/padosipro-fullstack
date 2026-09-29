import crypto from 'crypto';
import { prisma } from '../db';
import {
  hashOtp,
  generateNumericOtp,
  createAndSaveOtp,
  verifyOtpCode,
} from '../services/otpService';
import { config } from '../config';

describe('OTP Security & Logic Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a dedicated test user
    const testUser = await prisma.user.create({
      data: {
        email: `otp_test_${Date.now()}@example.com`,
        passwordHash: 'argon2_mock_hash',
        isVerified: false,
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: 'otp_test_' } },
    });
    await prisma.$disconnect();
  });

  test('generateNumericOtp produces a 6-digit numeric string', () => {
    const otp = generateNumericOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('hashOtp computes a valid SHA-256 hex digest', () => {
    const otp = '654321';
    const expected = crypto.createHash('sha256').update(otp).digest('hex');
    expect(hashOtp(otp)).toBe(expected);
  });

  test('createAndSaveOtp stores only the SHA-256 hash in database', async () => {
    const result = await createAndSaveOtp(testUserId);
    expect(result.success).toBe(true);
    expect(result.otp).toBeDefined();

    const record = await prisma.otpCode.findFirst({
      where: { userId: testUserId, used: false },
    });

    expect(record).toBeDefined();
    // Verify stored value is 64 hex characters (SHA-256) and NOT plain OTP
    expect(record!.otpHash).toHaveLength(64);
    expect(record!.otpHash).not.toBe(result.otp);
    expect(record!.otpHash).toBe(hashOtp(result.otp!));
  });

  test('Resend within 30-second cooldown is rejected with remaining time', async () => {
    const resendResult = await createAndSaveOtp(testUserId);
    expect(resendResult.success).toBe(false);
    expect(resendResult.cooldownRemaining).toBeGreaterThan(0);
    expect(resendResult.cooldownRemaining).toBeLessThanOrEqual(config.otpCooldownSeconds);
  });

  test('Wrong OTP increments attempt counter and returns remaining attempts', async () => {
    const verifyRes = await verifyOtpCode(testUserId, '000000');
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.attemptsRemaining).toBe(config.otpMaxAttempts - 1);

    const record = await prisma.otpCode.findFirst({
      where: { userId: testUserId, used: false },
    });
    expect(record!.attempts).toBe(1);
  });

  test('5th wrong attempt permanently locks and invalidates OTP', async () => {
    // Perform 4 more incorrect attempts (total 5)
    await verifyOtpCode(testUserId, '111111');
    await verifyOtpCode(testUserId, '222222');
    await verifyOtpCode(testUserId, '333333');
    const finalAttempt = await verifyOtpCode(testUserId, '444444');

    expect(finalAttempt.success).toBe(false);
    expect(finalAttempt.isLocked).toBe(true);
    expect(finalAttempt.attemptsRemaining).toBe(0);

    // Code is now marked used
    const activeRecords = await prisma.otpCode.findMany({
      where: { userId: testUserId, used: false },
    });
    expect(activeRecords.length).toBe(0);
  });

  test('Expired OTP is rejected', async () => {
    // Create an expired OTP record directly
    const expiredRecord = await prisma.otpCode.create({
      data: {
        userId: testUserId,
        otpHash: hashOtp('123456'),
        expiresAt: new Date(Date.now() - 1000), // 1 sec in past
        attempts: 0,
        used: false,
      },
    });

    const verifyRes = await verifyOtpCode(testUserId, '123456');
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.isExpired).toBe(true);
  });

  test('Correct OTP verifies email, marks OTP used, and sets isVerified true', async () => {
    // Create a fresh unexpired OTP
    const plain = '987123';
    await prisma.otpCode.create({
      data: {
        userId: testUserId,
        otpHash: hashOtp(plain),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        used: false,
      },
    });

    const verifyRes = await verifyOtpCode(testUserId, plain);
    expect(verifyRes.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.isVerified).toBe(true);
  });
});
