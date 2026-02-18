import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all expenses for authenticated user
 */
export const getAllExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { includeInactive } = req.query;

    const whereClause: any = { userId };

    // By default, only return active expenses
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json({
      expenses,
      total: expenses.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!expense) {
      throw new AppError('Despesa não encontrada!', 404);
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new expense
 */
export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { name, description, amount, isRecurring } = req.body;

    // Check if expense with same name already exists
    const existingExpense = await prisma.expense.findUnique({
      where: {
        userId_name: {
          userId,
          name
        }
      }
    });

    if (existingExpense) {
      throw new AppError('Já existe uma despesa com este nome!', 409);
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        name,
        description: description || null,
        amount,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Despesa criada com sucesso!',
      expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update expense
 */
export const updateExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, amount, isRecurring, isActive } = req.body;

    // Check if expense exists and belongs to user
    const expense = await prisma.expense.findFirst({
      where: { id, userId }
    });

    if (!expense) {
      throw new AppError('Despesa não encontrada!', 404);
    }

    // If updating name, check for duplicates
    if (name && name !== expense.name) {
      const existingExpense = await prisma.expense.findUnique({
        where: {
          userId_name: {
            userId,
            name
          }
        }
      });

      if (existingExpense) {
        throw new AppError('Já existe uma despesa com este nome!', 409);
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        name: name !== undefined ? name : expense.name,
        description: description !== undefined ? description : expense.description,
        amount: amount !== undefined ? amount : expense.amount,
        isRecurring: isRecurring !== undefined ? isRecurring : expense.isRecurring,
        isActive: isActive !== undefined ? isActive : expense.isActive
      }
    });

    res.json({
      message: 'Despesa atualizada com sucesso!',
      expense: updatedExpense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete expense (soft delete - set isActive to false)
 */
export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;

    // Check if expense exists and belongs to user
    const expense = await prisma.expense.findFirst({
      where: { id, userId }
    });

    if (!expense) {
      throw new AppError('Despesa não encontrada!', 404);
    }

    // Soft delete
    await prisma.expense.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      message: 'Despesa desativada com sucesso!'
    });
  } catch (error) {
    next(error);
  }
};
