import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    if (!req.user) {
      throw new AppError('Usuário não encontrado!', 401);
    }

    const userId = req.user.id;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    // Pegar tarefas do mês atual!
    const currentMonthTasks = await prisma.task.findMany({
      where: {
        userId,
        creationDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        client: true
      }
    });

    const currentMonthHours = currentMonthTasks.reduce(
      (acc, task) => acc + Number(task.hoursSpent),
      0
    );

    // Pega tarefas completas e pendentes!
    const completedTasksCount = currentMonthTasks.filter(t => t.status === 'completed').length;
    const pendingTasksCount = currentMonthTasks.filter(t => t.status === 'pending').length;

    // Total de clientes!
    const totalClients = await prisma.client.count({
      where: {
        userId,
        isActive: true
      }
    });

    // Ultimas 10 tarefas
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { creationDate: 'desc' },
      take: 10,
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        taskType: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    // Clientes por hora (Mes atual)
    const clientHours: Record<string, { name: string; hours: number }> = {};

    currentMonthTasks.forEach(task => {
      const clientId = task.clientId;
      const clientName = task.client.name;
      const hours = Number(task.hoursSpent);

      if (!clientHours[clientId]) {
        clientHours[clientId] = { name: clientName, hours: 0 };
      }

      clientHours[clientId].hours += hours;
    });

    // Pega status do faturamento mensal para calcular receita
    const closureForRate = await prisma.monthlyClosures.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: currentMonth,
          year: currentYear
        }
      }
    });
    const hourlyRate = closureForRate ? Number(closureForRate.hourlyRate) : 0;

    const topClients = Object.entries(clientHours)
      .map(([id, data]) => ({
        id,
        ...data,
        revenue: data.hours * hourlyRate
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Pega status do faturamento mensal.
    const currentClosure = await prisma.monthlyClosures.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: currentMonth,
          year: currentYear
        }
      }
    });

    // Calcula receita do mês baseado no hourlyRate do fechamento
    const currentMonthRevenue = currentClosure
      ? currentMonthHours * Number(currentClosure.hourlyRate)
      : 0;

    res.json({
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        hours: currentMonthHours,
        revenue: currentMonthRevenue,
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        closureStatus: currentClosure?.status || 'not_created'
      },
      totalClients,
      recentTasks,
      topClients
    });
  } catch (error) {
    next(error);
  }
};

// Pega estatísticas de receita por cliente!
export const getRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);

    const end = endDate
      ? new Date(endDate as string)
      : new Date(new Date().getFullYear(), 11, 31);

    // Tarefas por periodo!
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        creationDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        client: true
      }
    });

    // Calcula horas por cliente!
    const hoursByClient: Record<string, { name: string; hours: number }> = {};

    tasks.forEach(task => {
      const clientId = task.clientId;
      const clientName = task.client.name;
      const hours = Number(task.hoursSpent);

      if (!hoursByClient[clientId]) {
        hoursByClient[clientId] = { name: clientName, hours: 0 };
      }

      hoursByClient[clientId].hours += hours;
    });

    const totalHours = tasks.reduce((acc, task) => acc + Number(task.hoursSpent), 0);

    const byClient = Object.entries(hoursByClient)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.hours - a.hours);

    res.json({
      period: {
        startDate: start,
        endDate: end
      },
      totals: {
        hours: totalHours,
        tasksCount: tasks.length
      },
      byClient
    });
  } catch (error) {
    next(error);
  }
};

// Pega estatísticas de produtividade por tipo de tarefa!
export const getProductivityStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const end = endDate
      ? new Date(endDate as string)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Tarefas por periodo!
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        creationDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        taskType: true
      }
    });

    const hoursByType: Record<string, { name: string; color: string; hours: number; count: number }> = {};

    tasks.forEach(task => {
      const typeId = task.taskTypeId;
      const typeName = task.taskType.name;
      const typeColor = task.taskType.color;
      const hours = Number(task.hoursSpent);

      if (!hoursByType[typeId]) {
        hoursByType[typeId] = { name: typeName, color: typeColor, hours: 0, count: 0 };
      }

      hoursByType[typeId].hours += hours;
      hoursByType[typeId].count += 1;
    });

    const totalHours = tasks.reduce((acc, task) => acc + Number(task.hoursSpent), 0);

    const byTaskType = Object.entries(hoursByType)
      .map(([id, data]) => ({
        id,
        ...data,
        percentage: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
      }))
      .sort((a, b) => b.hours - a.hours);

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyAverage = totalHours / days;

    res.json({
      period: {
        startDate: start,
        endDate: end,
        days
      },
      totals: {
        hours: totalHours,
        tasksCount: tasks.length,
        dailyAverage
      },
      byTaskType
    });
  } catch (error) {
    next(error);
  }
};

// Comparação mensal de métricas.
export const getMonthlyComparison = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const userId = req.user.id;
    const { months = 6 } = req.query;

    const monthsToCompare = Math.min(Number(months), 12);
    const now = new Date();

    const monthlyData = [];

    for (let i = 0; i < monthsToCompare; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const tasks = await prisma.task.findMany({
        where: {
          userId,
          creationDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          client: true
        }
      });

      const hours = tasks.reduce((acc, task) => acc + Number(task.hoursSpent), 0);

      // Faturamento do Mês
      const closure = await prisma.monthlyClosures.findUnique({
        where: {
          userId_month_year: {
            userId,
            month,
            year
          }
        }
      });

      // Calcula receita do mês baseado no hourlyRate do fechamento
      const revenue = closure ? hours * Number(closure.hourlyRate) : 0;

      monthlyData.push({
        month,
        year,
        monthName: targetDate.toLocaleString('en-US', { month: 'short' }),
        hours,
        revenue,
        tasksCount: tasks.length,
        closureStatus: closure?.status || 'not_created'
      });
    }

    res.json({
      months: monthlyData.reverse()
    });
  } catch (error) {
    next(error);
  }
};

export const getTasksDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.workDate = {};
      if (startDate) dateFilter.workDate.gte = new Date(startDate as string);
      if (endDate) dateFilter.workDate.lte = new Date(endDate as string);
    }

    // Obter todas as tarefas com seus respectivos registros de horas!
    // Incluir apenas as tarefas que possuem horas estimadas
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
        estimatedHours: { not: null },
      },
      include: {
        hourRecords: {
          where: dateFilter,
          select: {
            hoursWorked: true,
            workDate: true,
          },
        },
      },
    });

    let totalEstimated = 0;
    let totalSpent = 0;
    let onTrackCount = 0;
    let nearLimitCount = 0;
    let exceededCount = 0;
    const tasksWithDeviations: any[] = [];

    tasks.forEach((task) => {
      const estimated = Number(task.estimatedHours);
      const spent = task.hourRecords.reduce(
        (sum: number, r: any) => sum + Number(r.hoursWorked),
        0
      );
      const percentage = estimated > 0 ? (spent / estimated) * 100 : 0;

      totalEstimated += estimated;
      totalSpent += spent;

      if (percentage <= 80) onTrackCount++;
      else if (percentage <= 100) nearLimitCount++;
      else exceededCount++;

      tasksWithDeviations.push({
        taskNumber: task.taskNumber,
        name: task.name,
        estimated,
        spent,
        deviation: spent - estimated,
        deviationPercentage: percentage - 100,
      });
    });

    const topDeviations = tasksWithDeviations
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, 5);

    const evolutionData: Record<string, number> = {};
    tasks.forEach((task) => {
      task.hourRecords.forEach((record: any) => {
        const dateKey = record.workDate.toISOString().split('T')[0];
        evolutionData[dateKey] = (evolutionData[dateKey] || 0) + Number(record.hoursWorked);
      });
    });

    const evolution = Object.entries(evolutionData)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Alertas
    const alerts = tasks
      .map((task) => {
        const spent = task.hourRecords.reduce(
          (sum: number, r: any) => sum + Number(r.hoursWorked),
          0
        );
        const estimated = Number(task.estimatedHours);
        const percentage = estimated > 0 ? (spent / estimated) * 100 : 0;

        if (percentage > 90) {
          return {
            taskNumber: task.taskNumber,
            name: task.name,
            percentage: Math.round(percentage * 100) / 100,
            type: percentage > 100 ? 'exceeded' : 'near-limit',
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json({
      summary: {
        totalTasks: tasks.length,
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        utilizationPercentage:
          totalEstimated > 0
            ? Math.round((totalSpent / totalEstimated) * 100 * 100) / 100
            : 0,
      },
      statusDistribution: {
        onTrack: onTrackCount,
        nearLimit: nearLimitCount,
        exceeded: exceededCount,
      },
      topDeviations,
      evolution,
      alerts,
    });
  } catch (error) {
    throw error;
  }
};
