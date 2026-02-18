import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get user settings
 * GET /api/settings
 */
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    // Create default settings if doesn't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
        },
      });
    }

    res.json({ settings });
  } catch (error) {
    throw error;
  }
};

/**
 * Update user settings
 * PUT /api/settings
 */
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      currency,
      dateFormat,
      theme,
      allowFutureDateHourRecords,
    } = req.body;

    // Build update data
    const updateData: any = {};
    if (currency !== undefined) updateData.currency = currency;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
    if (theme !== undefined) updateData.theme = theme;
    if (allowFutureDateHourRecords !== undefined) {
      updateData.allowFutureDateHourRecords = allowFutureDateHourRecords;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: updateData,
      create: {
        userId: req.user.id,
        ...updateData,
      },
    });

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    throw error;
  }
};
