import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const saveProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number (e.g. +91 9876543210)'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters long'),
  businessName: z.string().trim().optional().or(z.literal('')),
});

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  res.status(200).json({
    success: true,
    profile,
  });
}

export async function saveProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { fullName, mobileNumber, address, businessName } = req.body;

  // Normalize mobile number to +91XXXXXXXXXX
  const digitsOnly = mobileNumber.replace(/\D/g, '');
  const tenDigit = digitsOnly.slice(-10);
  const formattedMobile = `+91 ${tenDigit}`;

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      fullName,
      mobileNumber: formattedMobile,
      address,
      businessName: businessName && businessName.trim().length > 0 ? businessName.trim() : null,
    },
    create: {
      userId,
      fullName,
      mobileNumber: formattedMobile,
      address,
      businessName: businessName && businessName.trim().length > 0 ? businessName.trim() : null,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Profile saved successfully.',
    profile,
  });
}
