import { Request, Response } from 'express';
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
