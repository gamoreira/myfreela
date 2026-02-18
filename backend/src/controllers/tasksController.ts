import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

/**
 * Get all tasks with advanced filtering and pagination
 * GET /api/tasks
 */
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      page = '1',
      limit = '20',
      clientId,
      taskTypeId,
      status,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      userId: req.user.id,
    };

    if (clientId) {
      where.clientId = clientId as string;
    }

    if (taskTypeId) {
      where.taskTypeId = taskTypeId as string;
    }

    if (status && (status === 'pending' || status === 'completed')) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.creationDate = {};
      if (dateFrom) {
        where.creationDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.creationDate.lte = new Date(dateTo as string);
      }
    }

    if (search) {
      where.description = {
        contains: search as string,
      };
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get tasks with relations
    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        creationDate: 'desc',
      },
      skip,
      take: limitNum,
    });

    // Calculate total hours for the filtered results
    const hoursResult = await prisma.task.aggregate({
      where,
      _sum: {
        hoursSpent: true,
      },
    });

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: {
        totalHours: hoursResult._sum.hoursSpent || 0,
        totalTasks: total,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        hourRecords: {
          orderBy: {
            workDate: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json({ task });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new task
 * POST /api/tasks
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { clientId, taskTypeId, taskNumber, name, description, estimatedHours, creationDate, status, tags } = req.body;

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user.id,
      },
    });

    if (!client) {
      throw new AppError('Client not found or does not belong to you', 404);
    }

    // Verify task type belongs to user
    const taskType = await prisma.taskType.findFirst({
      where: {
        id: taskTypeId,
        userId: req.user.id,
      },
    });

    if (!taskType) {
      throw new AppError('Task type not found or does not belong to you', 404);
    }

    // Validate that a new task cannot be created with 'completed' status
    // since new tasks always have 0 hours initially
    if (status === 'completed') {
      throw new AppError('Não é possível criar uma tarefa com status concluído sem horas registradas', 400);
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        clientId,
        taskTypeId,
        taskNumber,
        name,
        ...(description && { description }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        hoursSpent: 0, // Initialize with 0, will be updated via hour records
        creationDate: new Date(creationDate),
        status: status || 'pending',
        ...(tags && { tags }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update a task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { clientId, taskTypeId, taskNumber, name, description, estimatedHours, creationDate, status, tags } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // If clientId is being changed, verify it belongs to user
    if (clientId && clientId !== existingTask.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: req.user.id,
        },
      });

      if (!client) {
        throw new AppError('Client not found or does not belong to you', 404);
      }
    }

    // If taskTypeId is being changed, verify it belongs to user
    if (taskTypeId && taskTypeId !== existingTask.taskTypeId) {
      const taskType = await prisma.taskType.findFirst({
        where: {
          id: taskTypeId,
          userId: req.user.id,
        },
      });

      if (!taskType) {
        throw new AppError('Task type not found or does not belong to you', 404);
      }
    }

    // Validate that task has hours registered before marking as completed
    if (status === 'completed' && Number(existingTask.hoursSpent) <= 0) {
      throw new AppError('Não é possível concluir uma tarefa sem horas registradas', 400);
    }

    // Build update data
    const updateData: Prisma.TaskUpdateInput = {};

    if (clientId !== undefined) updateData.client = { connect: { id: clientId } };
    if (taskTypeId !== undefined) updateData.taskType = { connect: { id: taskTypeId } };
    if (taskNumber !== undefined) updateData.taskNumber = taskNumber;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (creationDate !== undefined) updateData.creationDate = new Date(creationDate);
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags as any;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if task exists and belongs to user, include hour records
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        hourRecords: {
          select: {
            id: true,
            workDate: true,
            hoursWorked: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // Validation: Cannot delete a completed task
    if (existingTask.status === 'completed') {
      throw new AppError('Não é possível excluir uma tarefa concluída', 400);
    }

    // Validation: Check if there are hours in a closed monthly closure
    if (existingTask.hourRecords.length > 0) {
      const closedClosure = await findClosedClosureForHourRecords(
        req.user.id,
        existingTask.hourRecords
      );

      if (closedClosure) {
        throw new AppError(
          `Não é possível excluir a tarefa. Existem horas registradas em um faturamento já concluído (${String(closedClosure.month).padStart(2, '0')}/${closedClosure.year})`,
          400
        );
      }
    }

    // Collect info about open closures that need to be updated BEFORE deleting
    const closuresToUpdate: Array<{ month: number; year: number; clientId: string }> = [];

    if (existingTask.hourRecords.length > 0) {
      const seen = new Set<string>();
      existingTask.hourRecords.forEach((record) => {
        const { month, year } = getMonthYearFromDate(record.workDate);
        const key = `${year}-${month}-${existingTask.clientId}`;
        if (!seen.has(key)) {
          seen.add(key);
          closuresToUpdate.push({
            month,
            year,
            clientId: existingTask.clientId,
          });
        }
      });
    }

    // Delete the task (HourRecords will be cascade deleted)
    await prisma.task.delete({
      where: { id },
    });

    // Update open closures that were affected
    for (const closure of closuresToUpdate) {
      await updateMonthlyClosureAfterTaskDeletion(
        req.user.id,
        closure.clientId,
        closure.month,
        closure.year
      );
    }

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Helper function to extract month/year from a date (handles timezone)
 */
function getMonthYearFromDate(date: Date): { month: number; year: number } {
  // Use UTC to avoid timezone issues
  const d = new Date(date);
  return {
    month: d.getUTCMonth() + 1,
    year: d.getUTCFullYear(),
  };
}

/**
 * Helper function to find closed closure for hour records
 */
async function findClosedClosureForHourRecords(
  userId: string,
  hourRecords: Array<{ workDate: Date }>
): Promise<{ month: number; year: number } | null> {
  // Get unique month/year pairs from hour records
  const monthYearPairs = new Map<string, { month: number; year: number }>();

  hourRecords.forEach((record) => {
    const { month, year } = getMonthYearFromDate(record.workDate);
    const key = `${year}-${month}`;
    if (!monthYearPairs.has(key)) {
      monthYearPairs.set(key, { month, year });
    }
  });

  // Check each period for a closed closure
  for (const { month, year } of monthYearPairs.values()) {
    const closedClosure = await prisma.monthlyClosures.findFirst({
      where: {
        userId,
        month,
        year,
        status: 'closed',
      },
    });

    if (closedClosure) {
      return { month, year };
    }
  }

  return null;
}

/**
 * Helper function to update monthly closure after task deletion
 */
async function updateMonthlyClosureAfterTaskDeletion(
  userId: string,
  clientId: string,
  month: number,
  year: number
): Promise<void> {
  // Find open closure for the period
  const closure = await prisma.monthlyClosures.findFirst({
    where: {
      userId,
      month,
      year,
      status: 'open',
    },
    include: {
      clients: true,
    },
  });

  if (!closure) return;

  // Calculate new total hours for the client in the period
  // Use UTC dates to match database storage
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const hourRecords = await prisma.hourRecord.findMany({
    where: {
      userId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
      task: {
        clientId,
      },
    },
  });

  const totalHours = hourRecords.reduce(
    (sum, record) => sum + Number(record.hoursWorked),
    0
  );

  const existingClosureClient = closure.clients.find(
    (c: { clientId: string }) => c.clientId === clientId
  );

  if (totalHours === 0) {
    // Remove MonthlyClosureClient if there are no more hours
    if (existingClosureClient) {
      await prisma.monthlyClosureClients.delete({
        where: { id: existingClosureClient.id },
      });
    }
  } else if (existingClosureClient) {
    // Recalculate values using closure's hourly rate
    const grossAmount = totalHours * Number(closure.hourlyRate);
    const taxAmount = grossAmount * (Number(closure.taxPercentage) / 100);
    const netAmount = grossAmount - taxAmount;

    await prisma.monthlyClosureClients.update({
      where: { id: existingClosureClient.id },
      data: {
        totalHours,
        grossAmount,
        taxAmount,
        netAmount,
      },
    });
  }
}

/**
 * Toggle task status (pending <-> completed)
 * PATCH /api/tasks/:id/status
 */
export const toggleTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        hourRecords: {
          select: {
            workDate: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const newStatus = existingTask.status === 'pending' ? 'completed' : 'pending';

    // Validate that task has hours registered before marking as completed
    if (newStatus === 'completed' && Number(existingTask.hoursSpent) <= 0) {
      throw new AppError('Não é possível concluir uma tarefa sem horas registradas', 400);
    }

    // Validation: Cannot reopen a task if its hours are in a closed monthly closure
    if (newStatus === 'pending' && existingTask.hourRecords.length > 0) {
      const closedClosure = await findClosedClosureForHourRecords(
        req.user.id,
        existingTask.hourRecords
      );

      if (closedClosure) {
        throw new AppError(
          `Não é possível reabrir a tarefa. Existem horas registradas em um faturamento já concluído (${String(closedClosure.month).padStart(2, '0')}/${closedClosure.year})`,
          400
        );
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.json({
      message: `Task status changed to ${newStatus}`,
      task,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Duplicate a task
 * POST /api/tasks/:id/duplicate
 */
export const duplicateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { creationDate } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const createData: any = {
      userId: req.user.id,
      clientId: existingTask.clientId,
      taskTypeId: existingTask.taskTypeId,
      taskNumber: existingTask.taskNumber,
      name: existingTask.name,
      hoursSpent: existingTask.hoursSpent,
      creationDate: creationDate ? new Date(creationDate) : new Date(),
      status: 'pending', // Always create as pending
    };

    if (existingTask.description) {
      createData.description = existingTask.description as string;
    }

    if (existingTask.tags) {
      createData.tags = existingTask.tags;
    }

    const task = await prisma.task.create({
      data: createData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Task duplicated successfully',
      task,
    });
  } catch (error) {
    throw error;
  }
};
