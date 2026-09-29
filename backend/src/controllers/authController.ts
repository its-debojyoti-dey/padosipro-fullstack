import { Request, Response } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../db';
import { createAndSaveOtp, verifyOtpCode } from '../services/otpService';
import { sendOtpEmail } from '../services/mailService';
import { generateToken } from '../services/tokenService';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.isVerified) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists. Please log in.',
      });
      return;
    }

    // User registered previously but not yet verified: issue a new OTP
    const otpRes = await createAndSaveOtp(existingUser.id);
    if (!otpRes.success) {
      res.status(429).json({
        success: false,
        error: otpRes.message,
        cooldownRemaining: otpRes.cooldownRemaining,
      });
      return;
    }

    await sendOtpEmail(existingUser.email, otpRes.otp!);

    res.status(200).json({
      success: true,
      message: 'Account exists but unverified. A new verification OTP has been sent.',
      userId: existingUser.id,
      email: existingUser.email,
    });
    return;
  }

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      isVerified: false,
    },
  });

  // Generate and save 6-digit hashed OTP
  const otpRes = await createAndSaveOtp(newUser.id);
  if (otpRes.otp) {
    await sendOtpEmail(newUser.email, otpRes.otp);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email for the 6-digit OTP verification code.',
    userId: newUser.id,
    email: newUser.email,
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'No account found with this email.',
    });
    return;
  }

  if (user.isVerified) {
    res.status(200).json({
      success: true,
      message: 'Email is already verified. You can now log in.',
    });
    return;
  }

  const verification = await verifyOtpCode(user.id, otp);
  if (!verification.success) {
    const statusCode = verification.isLocked ? 423 : 400; // Locked or bad request
    res.status(statusCode).json({
      success: false,
      error: verification.message,
      attemptsRemaining: verification.attemptsRemaining,
      isLocked: verification.isLocked,
      isExpired: verification.isExpired,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
  });
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'No account found with this email.',
    });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({
      success: false,
      error: 'Account is already verified. Please log in directly.',
    });
    return;
  }

  const otpRes = await createAndSaveOtp(user.id);
  if (!otpRes.success) {
    res.status(429).json({
      success: false,
      error: otpRes.message,
      cooldownRemaining: otpRes.cooldownRemaining,
    });
    return;
  }

  await sendOtpEmail(user.email, otpRes.otp!);

  res.status(200).json({
    success: true,
    message: 'New OTP verification code sent to your email.',
    cooldownSeconds: 30,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password.',
    });
    return;
  }

  const passwordValid = await argon2.verify(user.passwordHash, password);
  if (!passwordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password.',
    });
    return;
  }

  // Check if verified: unverified users sent back to verification
  if (!user.isVerified) {
    res.status(403).json({
      success: false,
      error: 'Your email address is not verified yet. Please verify your OTP to continue.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      email: user.email,
      hasProfile: !!user.profile,
    },
  });
}
