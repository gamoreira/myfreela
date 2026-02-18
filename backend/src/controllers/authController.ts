import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('E-mail já existente!', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user,
      token,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('E-mail ou senha inválidos!', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('E-mail ou senha inválidos!', 401);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        defaultTaxPercentage: user.defaultTaxPercentage ? Number(user.defaultTaxPercentage) : 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        isAdmin: req.user.isAdmin,
        defaultTaxPercentage: req.user.defaultTaxPercentage ? Number(req.user.defaultTaxPercentage) : 0,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile (name and email)
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('E-mail já existente!', 409);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        defaultTaxPercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        ...updatedUser,
        defaultTaxPercentage: updatedUser.defaultTaxPercentage ? Number(updatedUser.defaultTaxPercentage) : 0,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password
 * PUT /api/auth/password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado!', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Senha atual incorreta!', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({
      message: 'Senha alterada com sucesso!',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update user preferences (default tax percentage)
 * PUT /api/auth/preferences
 */
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { defaultTaxPercentage } = req.body;

    // Update preferences
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        defaultTaxPercentage,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        defaultTaxPercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Preferencias alteradas com sucesso!',
      user: {
        ...updatedUser,
        defaultTaxPercentage: updatedUser.defaultTaxPercentage ? Number(updatedUser.defaultTaxPercentage) : 0,
      },
    });
  } catch (error) {
    throw error;
  }
};
