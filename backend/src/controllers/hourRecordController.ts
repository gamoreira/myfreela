import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

async function updateMonthlyClosureIfExists(taskId: string, userId: string): Promise<void> {
  // 1. Buscar a tarefa para obter creationDate e clientId
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: true }
  });

  if (!task) return;

  // 2. Determinar mês/ano baseado na creationDate
  const creationDate = new Date(task.creationDate);
  const month = creationDate.getMonth() + 1; // 1-12
  const year = creationDate.getFullYear();

  // 3. Buscar faturamento existente para o período
  const closure = await prisma.monthlyClosures.findUnique({
    where: {
      userId_month_year: { userId, month, year }
    }
  });

  // Se não existe faturamento ou está fechado, não fazer nada
  if (!closure || closure.status === 'closed') return;

  // 4. Calcular total de horas do cliente no período
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const tasksInPeriod = await prisma.task.findMany({
    where: {
      userId,
      clientId: task.clientId,
      creationDate: { gte: startDate, lt: endDate }
    },
    select: { hoursSpent: true }
  });

  const totalHours = tasksInPeriod.reduce(
    (sum, t) => sum + Number(t.hoursSpent), 0
  );

  // 5. Buscar ou criar entrada do cliente no faturamento
  const existingClientEntry = await prisma.monthlyClosureClients.findUnique({
    where: {
      monthlyClosureId_clientId: {
        monthlyClosureId: closure.id,
        clientId: task.clientId
      }
    }
  });

  if (totalHours === 0) {
    // Se não há mais horas, remover entrada do cliente
    if (existingClientEntry) {
      await prisma.monthlyClosureClients.delete({
        where: { id: existingClientEntry.id }
      });
    }
    return;
  }

  // 6. Calcular valores usando hourlyRate do faturamento
  const hourlyRate = Number(closure.hourlyRate);
  const grossAmount = totalHours * hourlyRate;
  const taxAmount = grossAmount * (Number(closure.taxPercentage) / 100);
  const netAmount = grossAmount - taxAmount;

  // 7. Atualizar ou criar entrada
  if (existingClientEntry) {
    await prisma.monthlyClosureClients.update({
      where: { id: existingClientEntry.id },
      data: { totalHours, grossAmount, taxAmount, netAmount }
    });
  } else {
    await prisma.monthlyClosureClients.create({
      data: {
        monthlyClosureId: closure.id,
        clientId: task.clientId,
        totalHours,
        grossAmount,
        taxAmount,
        netAmount
      }
    });
  }
}

async function updateTaskHoursSpent(taskId: string): Promise<void> {
  const hourRecords = await prisma.hourRecord.findMany({
    where: { taskId },
    select: { hoursWorked: true },
  });

  const totalHours = hourRecords.reduce(
    (sum, record) => sum + Number(record.hoursWorked),
    0
  );

  await prisma.task.update({
    where: { id: taskId },
    data: { hoursSpent: totalHours },
  });
}

// Pega as horas do usuário logado!
export const getAllHourRecords = async (req: Request, res: Response): Promise<void> => {
  try {

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const hourRecords = await prisma.hourRecord.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        workDate: 'desc',
      },
    });

    res.json({
      hourRecords,
      total: hourRecords.length,
    });
  } catch (error) {
    throw error;
  }
};

// Horas de uma tarefa especifica!
// GET /api/hour-records/task/:taskId
export const getHourRecordsByTask = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { taskId } = req.params;

    // Verificar se a tarefa pertence ao usuário!
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada!', 404);
    }

    const hourRecords = await prisma.hourRecord.findMany({
      where: {
        taskId: taskId,
      },
      orderBy: {
        workDate: 'desc',
      },
    });

    res.json({
      hourRecords,
      total: hourRecords.length,
    });
  } catch (error) {
    throw error;
  }
};

// Pega hora pelo ID
// GET /api/hour-records/:id
export const getHourRecordById = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const hourRecord = await prisma.hourRecord.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!hourRecord) {
      throw new AppError('Hour record not found', 404);
    }

    res.json({ hourRecord });
  } catch (error) {
    throw error;
  }
};

// Cria novo registro de Horas!
// POST /api/hour-records
export const createHourRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { taskId, workDate, hoursWorked, description } = req.body;

    // Tarefa existe para o usuário ?
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Valida horas trabalhadas!
    if (!hoursWorked || hoursWorked <= 0) {
      throw new AppError('Hours worked must be greater than 0', 400);
    }

    // Valida tamanho da descrição.
    if (description && description.length > 1000) {
      throw new AppError('Description must be at most 1000 characters', 400);
    }

    // Obtem as configurações do usuário para verificar se datas futuras são permitidas!
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    const workDateObj = new Date(workDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    workDateObj.setHours(0, 0, 0, 0);

    // Valida data futura!
    if (!userSettings?.allowFutureDateHourRecords && workDateObj > today) {
      throw new AppError(
        'A data de trabalho não pode ser futura. Habilite datas futuras nas configurações, se necessário!',
        400
      );
    }

    const hourRecord = await prisma.hourRecord.create({
      data: {
        userId: req.user.id,
        taskId,
        workDate: new Date(workDate),
        hoursWorked,
        description: description?.trim() || null,
      },
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            name: true,
            description: true,
          },
        },
      },
    });

    await updateTaskHoursSpent(taskId);
    await updateMonthlyClosureIfExists(taskId, req.user.id);

    res.status(201).json({
      message: 'Registro de horas adicionado com sucesso!',
      hourRecord,
    });
  } catch (error) {
    throw error;
  }
};

// Atualiza Hora!
// PUT /api/hour-records/:id
export const updateHourRecord = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;
    const { workDate, hoursWorked, description } = req.body;

    const existingRecord = await prisma.hourRecord.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingRecord) {
      throw new AppError('Registro de horas não encontrado!', 404);
    }

    if (hoursWorked !== undefined && hoursWorked <= 0) {
      throw new AppError('Horas trabalhadas devem ser maiores que 0', 400);
    }

    if (description !== undefined && description && description.length > 1000) {
      throw new AppError('Descrição deve ter no máximo 1000 caracteres', 400);
    }

    if (workDate !== undefined) {

      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: req.user.id },
      });

      const workDateObj = new Date(workDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      workDateObj.setHours(0, 0, 0, 0);

      // Permissão para datas futuras!
      if (!userSettings?.allowFutureDateHourRecords && workDateObj > today) {
        throw new AppError(
          'A data de trabalho não pode ser futura. Habilite datas futuras nas configurações, se necessário!',
          400
        );
      }
    }

    const updateData: any = {};
    if (workDate !== undefined) updateData.workDate = new Date(workDate);
    if (hoursWorked !== undefined) updateData.hoursWorked = hoursWorked;
    if (description !== undefined)
      updateData.description = description?.trim() || null;

    const hourRecord = await prisma.hourRecord.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            name: true,
            description: true,
          },
        },
      },
    });

    await updateTaskHoursSpent(existingRecord.taskId);
    await updateMonthlyClosureIfExists(existingRecord.taskId, req.user.id);

    res.json({
      message: 'Registro de horas atualizado com sucesso!',
      hourRecord,
    });
  } catch (error) {
    throw error;
  }
};

// Exclusão de horas!
// DELETE /api/hour-records/:id
export const deleteHourRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado!', 401);
    }

    const { id } = req.params;

    const existingRecord = await prisma.hourRecord.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingRecord) {
      throw new AppError('Registro de horas não encontrado', 404);
    }

    const taskId = existingRecord.taskId;

    await prisma.hourRecord.delete({
      where: { id },
    });

    await updateTaskHoursSpent(taskId);
    await updateMonthlyClosureIfExists(taskId, req.user.id);

    res.json({
      message: 'Registro de horas deletado com sucesso!',
    });
  } catch (error) {
    throw error;
  }
};
