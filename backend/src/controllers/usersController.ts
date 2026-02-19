import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all users (admin only)
 * GET /api/users
 */
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          clients: true,
          tasks: true,
          monthlyClosures: true,
          hourRecords: true,
          expenses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
};

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          clients: true,
          tasks: true,
          monthlyClosures: true,
          hourRecords: true,
          expenses: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado!', 404);
  }

  res.json({ user });
};

/**
 * Update user data (admin only)
 * PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, isAdmin, password } = req.body;

  if (!req.user) {
    throw new AppError('Usuário não autenticado!', 401);
  }

  // Admin cannot change their own isAdmin status
  if (id === req.user.id && isAdmin !== undefined) {
    throw new AppError('Você não pode alterar seu próprio tipo de usuário!', 400);
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });

  if (!targetUser) {
    throw new AppError('Usuário não encontrado!', 404);
  }

  // Check email uniqueness if changing email
  if (email && email !== targetUser.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('E-mail já está em uso!', 409);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(isAdmin !== undefined && { isAdmin }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          clients: true,
          tasks: true,
          monthlyClosures: true,
          hourRecords: true,
          expenses: true,
        },
      },
    },
  });

  res.json({ message: 'Usuário atualizado com sucesso!', user: updatedUser });
};

/**
 * Delete user with cascade (admin only)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    throw new AppError('Usuário não autenticado!', 401);
  }

  // Cannot delete yourself
  if (id === req.user.id) {
    throw new AppError('Você não pode excluir sua própria conta!', 400);
  }

  // Find the target user
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    throw new AppError('Usuário não encontrado!', 404);
  }

  // Cannot delete another admin
  if (targetUser.isAdmin) {
    throw new AppError('Não é possível excluir outro administrador!', 400);
  }

  // Delete user (cascade configured in schema)
  await prisma.user.delete({
    where: { id },
  });

  res.json({ message: 'Usuário excluído com sucesso!' });
};
