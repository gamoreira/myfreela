import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all task types for the authenticated user
 * GET /api/task-types
 */
export const getAllTaskTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const taskTypes = await prisma.taskType.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      taskTypes,
      total: taskTypes.length,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single task type by ID
 * GET /api/task-types/:id
 */
export const getTaskTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const taskType = await prisma.taskType.findFirst({
      where: {
        id,
        userId: req.user.id, // Ensure user owns this task type
      },
    });

    if (!taskType) {
      throw new AppError('Task type not found', 404);
    }

    res.json({ taskType });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new task type
 * POST /api/task-types
 */
export const createTaskType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { name, color, isActive = true } = req.body;

    // Check if task type with same name already exists for this user
    const existingTaskType = await prisma.taskType.findFirst({
      where: {
        userId: req.user.id,
        name,
      },
    });

    if (existingTaskType) {
      throw new AppError('A task type with this name already exists', 409);
    }

    const taskType = await prisma.taskType.create({
      data: {
        userId: req.user.id,
        name,
        color,
        isActive,
      },
    });

    res.status(201).json({
      message: 'Task type created successfully',
      taskType,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update a task type
 * PUT /api/task-types/:id
 */
export const updateTaskType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { name, color, isActive } = req.body;

    // Check if task type exists and belongs to user
    const existingTaskType = await prisma.taskType.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTaskType) {
      throw new AppError('Task type not found', 404);
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingTaskType.name) {
      const duplicateTaskType = await prisma.taskType.findFirst({
        where: {
          userId: req.user.id,
          name,
          id: { not: id },
        },
      });

      if (duplicateTaskType) {
        throw new AppError('A task type with this name already exists', 409);
      }
    }

    // Build update data object
    const updateData: {
      name?: string;
      color?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const taskType = await prisma.taskType.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Task type updated successfully',
      taskType,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a task type (soft delete by setting isActive to false)
 * DELETE /api/task-types/:id
 */
export const deleteTaskType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if task type exists and belongs to user
    const existingTaskType = await prisma.taskType.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTaskType) {
      throw new AppError('Task type not found', 404);
    }

    // Check if there are tasks using this task type
    const tasksCount = await prisma.task.count({
      where: {
        taskTypeId: id,
      },
    });

    if (tasksCount > 0) {
      // Soft delete if tasks exist
      const taskType = await prisma.taskType.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        message: 'Task type deactivated successfully (tasks are using it)',
        taskType,
        tasksCount,
      });
    } else {
      // Hard delete if no tasks exist
      await prisma.taskType.delete({
        where: { id },
      });

      res.json({
        message: 'Task type deleted successfully',
      });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get task type statistics
 * GET /api/task-types/:id/stats
 */
export const getTaskTypeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if task type exists and belongs to user
    const taskType = await prisma.taskType.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!taskType) {
      throw new AppError('Task type not found', 404);
    }

    // Get task statistics
    const totalTasks = await prisma.task.count({
      where: {
        taskTypeId: id,
      },
    });

    const completedTasks = await prisma.task.count({
      where: {
        taskTypeId: id,
        status: 'completed',
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        taskTypeId: id,
        status: 'pending',
      },
    });

    // Get total hours spent
    const hoursResult = await prisma.task.aggregate({
      where: {
        taskTypeId: id,
      },
      _sum: {
        hoursSpent: true,
      },
    });

    res.json({
      taskType: {
        id: taskType.id,
        name: taskType.name,
        color: taskType.color,
      },
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        totalHours: hoursResult._sum.hoursSpent || 0,
      },
    });
  } catch (error) {
    throw error;
  }
};
