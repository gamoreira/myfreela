import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/** Ensures hourlyRate and taxPercentage are plain numbers for JSON (Prisma Decimal may not serialize). */
function closureToResponse<T extends { taxPercentage?: unknown; hourlyRate?: unknown }>(closure: T): T {
  return {
    ...closure,
    taxPercentage: Number(closure.taxPercentage ?? 0),
    hourlyRate: Number(closure.hourlyRate ?? 0),
  };
}

/**
 * Get all monthly closures for authenticated user
 */
export const getAllClosures = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;

    const closures = await prisma.monthlyClosures.findMany({
      where: { userId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        expenses: {
          include: {
            expense: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Add pending tasks and tasks without hours info for each closure
    const closuresWithPendingInfo = await Promise.all(
      closures.map(async (closure) => {
        // Start date: first day of the month at 00:00:00
        const startDate = new Date(closure.year, closure.month - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        // End date: first day of NEXT month at 00:00:00 (exclusive)
        const endDate = new Date(closure.year, closure.month, 1);
        endDate.setHours(0, 0, 0, 0);

        const pendingTasksCount = await prisma.task.count({
          where: {
            userId,
            creationDate: {
              gte: startDate,
              lt: endDate
            },
            status: 'pending'
          }
        });

        const tasksWithoutHoursCount = await prisma.task.count({
          where: {
            userId,
            creationDate: {
              gte: startDate,
              lt: endDate
            },
            hoursSpent: {
              lte: 0
            }
          }
        });

        // Calculate total expenses
        const totalExpenses = closure.expenses.reduce(
          (acc, exp) => acc + Number(exp.amount),
          0
        );

        return closureToResponse({
          ...closure,
          hasPendingTasks: pendingTasksCount > 0,
          pendingTasksCount,
          hasTasksWithoutHours: tasksWithoutHoursCount > 0,
          tasksWithoutHoursCount,
          totalExpenses
        });
      })
    );

    res.json({
      closures: closuresWithPendingInfo,
      total: closuresWithPendingInfo.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly closure by ID
 */
export const getClosureById = async (
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

    const closure = await prisma.monthlyClosures.findFirst({
      where: {
        id,
        userId
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          },
          orderBy: {
            client: {
              name: 'asc'
            }
          }
        },
        expenses: {
          include: {
            expense: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado!', 404);
    }

    // Calculate totals
    interface Totals {
      totalHours: number;
      grossAmount: number;
      taxAmount: number;
      netAmount: number;
      totalExpenses: number;
      finalAmount: number;
    }

    const clientTotals = closure.clients.reduce(
      (acc, clientData) => ({
        totalHours: acc.totalHours + Number(clientData.totalHours),
        grossAmount: acc.grossAmount + Number(clientData.grossAmount),
        taxAmount: acc.taxAmount + Number(clientData.taxAmount),
        netAmount: acc.netAmount + Number(clientData.netAmount)
      }),
      { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
    );

    // Calculate total expenses
    const totalExpenses = closure.expenses.reduce(
      (acc, exp) => acc + Number(exp.amount),
      0
    );

    // Calculate final amount (netAmount - totalExpenses)
    const finalAmount = clientTotals.netAmount - totalExpenses;

    const totals: Totals = {
      ...clientTotals,
      totalExpenses,
      finalAmount
    };

    // Check for pending tasks and tasks without hours in the period
    // Start date: first day of the month at 00:00:00
    const startDate = new Date(closure.year, closure.month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End date: first day of NEXT month at 00:00:00 (exclusive)
    const endDate = new Date(closure.year, closure.month, 1);
    endDate.setHours(0, 0, 0, 0);

    const pendingTasksCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'pending'
      }
    });

    const tasksWithoutHoursCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate
        },
        hoursSpent: {
          lte: 0
        }
      }
    });

    res.json({
      closure: closureToResponse({
        ...closure,
        totals,
        hasPendingTasks: pendingTasksCount > 0,
        pendingTasksCount,
        hasTasksWithoutHours: tasksWithoutHoursCount > 0,
        tasksWithoutHoursCount
      })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new monthly closure
 * Automatically calculates totals for each client based on tasks
 * Now allows creating closure without tasks (e.g., for months with only expenses)
 */
export const createClosure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { month, year, taxPercentage, hourlyRate, notes, expenseIds, expenses: expensesData } = req.body;

    // Check if closure already exists for this month/year
    const existingClosure = await prisma.monthlyClosures.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year
        }
      }
    });

    if (existingClosure) {
      throw new AppError('Faturamento já existe para este mês/ano!', 409);
    }

    // Get all tasks for this month/year grouped by client
    // Start date: first day of the month at 00:00:00
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End date: first day of NEXT month at 00:00:00 (exclusive)
    const endDate = new Date(year, month, 1);
    endDate.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        client: true
      }
    });

    // Group tasks by client and calculate total hours
    interface ClientTotal {
      clientId: string;
      totalHours: number;
    }

    const clientTotals = tasks.reduce((acc: Record<string, ClientTotal>, task) => {
      const clientId = task.clientId;

      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          totalHours: 0
        };
      }

      acc[clientId].totalHours += Number(task.hoursSpent);

      return acc;
    }, {} as Record<string, ClientTotal>);

    // Validate and get expenses if provided
    let expensesToAdd: { expenseId: string | null; name: string; description: string | null; amount: number }[] = [];

    // New format: expenses array with custom amounts
    if (expensesData && Array.isArray(expensesData) && expensesData.length > 0) {
      const expenseIdsFromData = expensesData.filter((e: any) => e.expenseId).map((e: any) => e.expenseId);

      if (expenseIdsFromData.length > 0) {
        const registeredExpenses = await prisma.expense.findMany({
          where: {
            id: { in: expenseIdsFromData },
            userId,
            isActive: true
          }
        });

        const expenseMap = new Map(registeredExpenses.map(e => [e.id, e]));

        for (const expData of expensesData) {
          if (expData.expenseId) {
            const expense = expenseMap.get(expData.expenseId);
            if (!expense) {
              throw new AppError(`Despesa não encontrada: ${expData.expenseId}`, 400);
            }
            expensesToAdd.push({
              expenseId: expense.id,
              name: expense.name,
              description: expense.description,
              amount: Number(expData.amount) // Use custom amount
            });
          } else if (expData.name && expData.amount) {
            // Ad-hoc expense
            expensesToAdd.push({
              expenseId: null,
              name: expData.name,
              description: expData.description || null,
              amount: Number(expData.amount)
            });
          }
        }
      }
    }
    // Legacy format: just expense IDs (use registered amounts)
    else if (expenseIds && Array.isArray(expenseIds) && expenseIds.length > 0) {
      const expenses = await prisma.expense.findMany({
        where: {
          id: { in: expenseIds },
          userId,
          isActive: true
        }
      });

      if (expenses.length !== expenseIds.length) {
        throw new AppError('Uma ou mais despesas não foram encontradas!', 400);
      }

      expensesToAdd = expenses.map(exp => ({
        expenseId: exp.id,
        name: exp.name,
        description: exp.description,
        amount: Number(exp.amount)
      }));
    }

    // Create closure with client and expense data
    const closure = await prisma.monthlyClosures.create({
      data: {
        userId,
        month,
        year,
        taxPercentage,
        hourlyRate,
        notes: notes || null,
        status: 'open',
        clients: {
          create: Object.values(clientTotals).map(clientTotal => {
            // Calcula usando o hourlyRate único do faturamento
            const grossAmount = clientTotal.totalHours * Number(hourlyRate);
            const taxAmount = grossAmount * (Number(taxPercentage) / 100);
            const netAmount = grossAmount - taxAmount;

            return {
              clientId: clientTotal.clientId,
              totalHours: clientTotal.totalHours,
              grossAmount,
              taxAmount,
              netAmount
            };
          })
        },
        expenses: {
          create: expensesToAdd
        }
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        expenses: {
          include: {
            expense: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Faturamento mensal criado com sucesso',
      closure: closureToResponse(closure)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update monthly closure (notes and taxPercentage only)
 * If taxPercentage changes, recalculate all amounts
 */
export const updateClosure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { taxPercentage, hourlyRate, notes } = req.body;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId },
      include: {
        clients: true
      }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado', 404);
    }

    // If closure is closed, don't allow updates
    if (closure.status === 'closed') {
      throw new AppError('Não é possível atualizar um faturamento fechado', 400);
    }

    // Check if taxPercentage or hourlyRate changed - if so, recalculate
    const taxChanged = taxPercentage !== undefined && Number(taxPercentage) !== Number(closure.taxPercentage);
    const rateChanged = hourlyRate !== undefined && Number(hourlyRate) !== Number(closure.hourlyRate);

    if (taxChanged || rateChanged) {
      // Use new values if provided, otherwise use existing
      const newTax = taxPercentage !== undefined ? Number(taxPercentage) : Number(closure.taxPercentage);
      const newRate = hourlyRate !== undefined ? Number(hourlyRate) : Number(closure.hourlyRate);

      // Recalculate all client amounts
      const updatePromises = closure.clients.map(clientData => {
        const grossAmount = Number(clientData.totalHours) * newRate;
        const taxAmount = grossAmount * (newTax / 100);
        const netAmount = grossAmount - taxAmount;

        return prisma.monthlyClosureClients.update({
          where: { id: clientData.id },
          data: {
            grossAmount,
            taxAmount,
            netAmount
          }
        });
      });

      await Promise.all(updatePromises);
    }

    // Update closure (ensure numeric values for Prisma Decimal)
    const updatedClosure = await prisma.monthlyClosures.update({
      where: { id },
      data: {
        taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : closure.taxPercentage,
        hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : closure.hourlyRate,
        notes: notes !== undefined ? notes : closure.notes
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Check for pending tasks and tasks without hours in the period
    // Start date: first day of the month at 00:00:00
    const startDate = new Date(closure.year, closure.month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End date: first day of NEXT month at 00:00:00 (exclusive)
    const endDate = new Date(closure.year, closure.month, 1);
    endDate.setHours(0, 0, 0, 0);

    const pendingTasksCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'pending'
      }
    });

    const tasksWithoutHoursCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate
        },
        hoursSpent: {
          lte: 0
        }
      }
    });

    res.json({
      message: 'Faturamento mensal atualizado com sucesso!',
      closure: closureToResponse({
        ...updatedClosure,
        hasPendingTasks: pendingTasksCount > 0,
        pendingTasksCount,
        hasTasksWithoutHours: tasksWithoutHoursCount > 0,
        tasksWithoutHoursCount
      })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close monthly closure
 */
export const closeClosure = async (
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

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado!', 404);
    }

    if (closure.status === 'closed') {
      throw new AppError('Faturamento já está fechado!', 400);
    }

    // Check if there are pending tasks or tasks without hours for this period
    // Start date: first day of the month at 00:00:00
    const startDate = new Date(closure.year, closure.month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End date: first day of NEXT month at 00:00:00 (exclusive)
    const endDate = new Date(closure.year, closure.month, 1);
    endDate.setHours(0, 0, 0, 0);

    const pendingTasksCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate  // Changed from lte to lt (less than, not less than or equal)
        },
        status: 'pending'
      }
    });

    const tasksWithoutHoursCount = await prisma.task.count({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lt: endDate  // Changed from lte to lt
        },
        hoursSpent: {
          lte: 0
        }
      }
    });

    const errors = [];
    if (pendingTasksCount > 0) {
      errors.push(`${pendingTasksCount} tarefa(s) pendente(s)`);
    }
    if (tasksWithoutHoursCount > 0) {
      errors.push(`${tasksWithoutHoursCount} tarefa(s) sem horas registradas`);
    }

    if (errors.length > 0) {
      throw new AppError(
        `Não é possível fechar o faturamento. Existem: ${errors.join(' e ')}.`,
        400
      );
    }

    const updatedClosure = await prisma.monthlyClosures.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date()
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Monthly closure closed successfully',
      closure: closureToResponse(updatedClosure)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reopen monthly closure
 */
export const reopenClosure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Monthly closure not found', 404);
    }

    if (closure.status === 'open') {
      throw new AppError('Closure is already open', 400);
    }

    const updatedClosure = await prisma.monthlyClosures.update({
      where: { id },
      data: {
        status: 'open',
        closedAt: null
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Monthly closure reopened successfully',
      closure: closureToResponse(updatedClosure)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete monthly closure (hard delete)
 */
export const deleteClosure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { id } = req.params;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Monthly closure not found', 404);
    }

    // Delete closure (cascade will delete related MonthlyClosureClients)
    await prisma.monthlyClosures.delete({
      where: { id }
    });

    res.json({
      message: 'Monthly closure deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add expense to monthly closure
 */
export const addExpenseToClosure = async (
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
    const { expenseId, name, description, amount } = req.body;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado!', 404);
    }

    if (closure.status === 'closed') {
      throw new AppError('Não é possível adicionar despesas a um faturamento fechado!', 400);
    }

    let expenseData: { expenseId: string | null; name: string; description: string | null; amount: number };

    if (expenseId) {
      // Adding from registered expense
      const expense = await prisma.expense.findFirst({
        where: { id: expenseId, userId, isActive: true }
      });

      if (!expense) {
        throw new AppError('Despesa não encontrada!', 404);
      }

      expenseData = {
        expenseId: expense.id,
        name: expense.name,
        description: expense.description,
        amount: Number(expense.amount)
      };
    } else {
      // Adding ad-hoc expense
      if (!name || !amount) {
        throw new AppError('Nome e valor são obrigatórios para despesas avulsas!', 400);
      }

      expenseData = {
        expenseId: null,
        name,
        description: description || null,
        amount: Number(amount)
      };
    }

    const closureExpense = await prisma.monthlyClosureExpense.create({
      data: {
        monthlyClosureId: id,
        ...expenseData
      },
      include: {
        expense: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Despesa adicionada ao faturamento com sucesso!',
      expense: closureExpense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update expense in monthly closure
 */
export const updateClosureExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { id, expenseId } = req.params;
    const { name, description, amount } = req.body;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado!', 404);
    }

    if (closure.status === 'closed') {
      throw new AppError('Não é possível editar despesas de um faturamento fechado!', 400);
    }

    // Check if closure expense exists
    const closureExpense = await prisma.monthlyClosureExpense.findFirst({
      where: { id: expenseId, monthlyClosureId: id }
    });

    if (!closureExpense) {
      throw new AppError('Despesa do faturamento não encontrada!', 404);
    }

    const updatedExpense = await prisma.monthlyClosureExpense.update({
      where: { id: expenseId },
      data: {
        name: name !== undefined ? name : closureExpense.name,
        description: description !== undefined ? description : closureExpense.description,
        amount: amount !== undefined ? amount : closureExpense.amount
      },
      include: {
        expense: {
          select: {
            id: true,
            name: true
          }
        }
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
 * Remove expense from monthly closure
 */
export const removeExpenseFromClosure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { id, expenseId } = req.params;

    // Check if closure exists and belongs to user
    const closure = await prisma.monthlyClosures.findFirst({
      where: { id, userId }
    });

    if (!closure) {
      throw new AppError('Faturamento não encontrado!', 404);
    }

    if (closure.status === 'closed') {
      throw new AppError('Não é possível remover despesas de um faturamento fechado!', 400);
    }

    // Check if closure expense exists
    const closureExpense = await prisma.monthlyClosureExpense.findFirst({
      where: { id: expenseId, monthlyClosureId: id }
    });

    if (!closureExpense) {
      throw new AppError('Despesa do faturamento não encontrada!', 404);
    }

    await prisma.monthlyClosureExpense.delete({
      where: { id: expenseId }
    });

    res.json({
      message: 'Despesa removida do faturamento com sucesso!'
    });
  } catch (error) {
    next(error);
  }
};

