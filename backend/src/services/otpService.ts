import crypto from 'crypto';
import { prisma } from '../db';
import { config } from '../config';

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function generateNumericOtp(): string {
  // Generates cryptographically secure 6-digit integer string [100000 - 999999]
  return crypto.randomInt(100000, 1000000).toString();
}

export interface OtpGenerationResult {
  success: boolean;
  otp?: string;
  cooldownRemaining?: number;
  message?: string;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  isExpired?: boolean;
  isLocked?: boolean;
}

export async function createAndSaveOtp(userId: string): Promise<OtpGenerationResult> {
  // Check rate limit: 30-second resend cooldown
  const latestOtp = await prisma.otpCode.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (latestOtp) {
    const elapsedSeconds = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
    if (elapsedSeconds < config.otpCooldownSeconds) {
      const cooldownRemaining = config.otpCooldownSeconds - elapsedSeconds;
      return {
        success: false,
        cooldownRemaining,
        message: `Please wait ${cooldownRemaining}s before requesting a new OTP.`,
      };
    }
  }

  // Invalidate any active previous unused OTPs for this user
  await prisma.otpCode.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  const plainOtp = generateNumericOtp();
  const hashed = hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      userId,
      otpHash: hashed,
      expiresAt,
      attempts: 0,
      used: false,
    },
  });

  return {
    success: true,
    otp: plainOtp,
  };
}

export async function verifyOtpCode(userId: string, inputOtp: string): Promise<OtpVerificationResult> {
  const activeOtp = await prisma.otpCode.findFirst({
    where: { userId, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeOtp) {
    return {
      success: false,
      message: 'No active OTP found. Please request a new one.',
    };
  }

  // Check if max attempts already reached
  if (activeOtp.attempts >= config.otpMaxAttempts) {
    await prisma.otpCode.update({
      where: { id: activeOtp.id },
      data: { used: true },
    });
    return {
      success: false,
      isLocked: true,
      message: `Too many wrong attempts. This OTP has been invalidated. Please request a new code.`,
    };
  }

  // Check if expired
  if (new Date() > activeOtp.expiresAt) {
    await prisma.otpCode.update({
      where: { id: activeOtp.id },
      data: { used: true },
    });
    return {
      success: false,
      isExpired: true,
      message: 'This OTP has expired. Please request a new one.',
    };
  }

  // Verify SHA-256 hash
  const inputHash = hashOtp(inputOtp.trim());
  if (inputHash === activeOtp.otpHash) {
    // Valid! Mark OTP as used and user as verified
    await prisma.otpCode.update({
      where: { id: activeOtp.id },
      data: { used: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    return {
      success: true,
      message: 'Email successfully verified!',
    };
  }

  // Increment wrong attempt counter
  const updatedAttempts = activeOtp.attempts + 1;
  const attemptsRemaining = config.otpMaxAttempts - updatedAttempts;

  if (updatedAttempts >= config.otpMaxAttempts) {
    // Invalidate immediately on 5th failure
    await prisma.otpCode.update({
      where: { id: activeOtp.id },
      data: { attempts: updatedAttempts, used: true },
    });
    return {
      success: false,
      isLocked: true,
      attemptsRemaining: 0,
      message: `Maximum attempts reached (${config.otpMaxAttempts}/${config.otpMaxAttempts}). This OTP is now locked. Request a new one.`,
    };
  }

  await prisma.otpCode.update({
    where: { id: activeOtp.id },
    data: { attempts: updatedAttempts },
  });

  return {
    success: false,
    attemptsRemaining,
    message: `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
  };
}
