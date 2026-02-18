import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all clients for the authenticated user
 * GET /api/clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const clients = await prisma.client.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      clients,
      total: clients.length,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single client by ID
 * GET /api/clients/:id
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id, // Ensure user owns this client
      },
    });

    if (!client) {
      throw new AppError('Cliente não encontrado!', 404);
    }

    res.json({ client });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new client
 * POST /api/clients
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { name, isActive = true } = req.body;

    // Check if client with same name already exists for this user
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: req.user.id,
        name,
      },
    });

    if (existingClient) {
      throw new AppError('Já existe um cliente com este nome!', 409);
    }

    const client = await prisma.client.create({
      data: {
        userId: req.user.id,
        name,
        isActive,
      },
    });

    res.status(201).json({
      message: 'Cliente criado com sucesso!',
      client,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update a client
 * PUT /api/clients/:id
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;
    const { name, isActive } = req.body;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingClient) {
      throw new AppError('Cliente não encontrado!', 404);
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingClient.name) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          userId: req.user.id,
          name,
          id: { not: id },
        },
      });

      if (duplicateClient) {
        throw new AppError('Já existe um cliente com este nome!', 409);
      }
    }

    // Build update data object
    const updateData: {
      name?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Cliente atualizado com sucesso!',
      client,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a client (hard delete if no dependencies, otherwise returns error)
 * DELETE /api/clients/:id
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {

    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingClient) {
      throw new AppError('Cliente não encontrado!', 404);
    }

    // Check for dependencies
    const dependencies: string[] = [];

    // Check for tasks
    const tasksCount = await prisma.task.count({
      where: { clientId: id },
    });

    if (tasksCount > 0) {
      dependencies.push(`${tasksCount} tarefa${tasksCount > 1 ? 's' : ''}`);
    }

    // Check for monthly closure records
    const closuresCount = await prisma.monthlyClosureClients.count({
      where: { clientId: id },
    });

    if (closuresCount > 0) {
      dependencies.push(`${closuresCount} faturamento${closuresCount > 1 ? 's' : ''} mensal${closuresCount > 1 ? 'is' : ''}`);
    }

    // If dependencies exist, return error
    if (dependencies.length > 0) {
      throw new AppError(
        `Não é possível excluir o cliente pois possui dependências: ${dependencies.join(', ')}.`,
        409
      );
    }

    // Hard delete - no dependencies
    await prisma.client.delete({
      where: { id },
    });

    res.json({
      message: 'Cliente excluído com sucesso!',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get client's monthly closures
 * GET /api/clients/:id/closures
 */
export const getClientClosures = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;

    // Check if client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!client) {
      throw new AppError('Cliente não encontrado!', 404);
    }

    // Get all monthly closures for this client
    const closures = await prisma.monthlyClosureClients.findMany({
      where: {
        clientId: id,
      },
      include: {
        monthlyClosure: {
          select: {
            id: true,
            month: true,
            year: true,
            status: true,
            closedAt: true,
          },
        },
      },
      orderBy: [
        { monthlyClosure: { year: 'desc' } },
        { monthlyClosure: { month: 'desc' } },
      ],
    });

    res.json({
      client: {
        id: client.id,
        name: client.name,
      },
      closures,
      total: closures.length,
    });
  } catch (error) {
    throw error;
  }
};
