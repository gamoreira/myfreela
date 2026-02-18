import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get monthly report data (JSON)
 */
export const getMonthlyReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      throw new AppError('Month and year are required', 400);
    }

    const monthNum = Number(month);
    const yearNum = Number(year);

    // Get monthly closure (may not exist)
    const closure = await prisma.monthlyClosures.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: monthNum,
          year: yearNum
        }
      },
      include: {
        clients: {
          include: {
            client: true
          }
        }
      }
    });

    // Get all tasks for this month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        creationDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        client: true,
        taskType: true
      },
      orderBy: {
        creationDate: 'asc'
      }
    });

    // Get user's default tax percentage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultTaxPercentage: true }
    });

    const defaultTaxPercentage = Number(user?.defaultTaxPercentage || 0);

    let totals;
    let taxPercentage: number;

    if (closure) {
      // Use closure data for totals
      totals = closure.clients.reduce(
        (acc, clientData) => ({
          totalHours: acc.totalHours + Number(clientData.totalHours),
          grossAmount: acc.grossAmount + Number(clientData.grossAmount),
          taxAmount: acc.taxAmount + Number(clientData.taxAmount),
          netAmount: acc.netAmount + Number(clientData.netAmount)
        }),
        { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
      );
      taxPercentage = Number(closure.taxPercentage);
    } else {
      // Calculate totals from tasks (preview mode - only hours available without closure)
      const totalHours = tasks.reduce((sum, task) => sum + Number(task.hoursSpent), 0);

      totals = { totalHours, grossAmount: 0, taxAmount: 0, netAmount: 0 };
      taxPercentage = defaultTaxPercentage;
    }

    res.json({
      closure,
      tasks,
      totals,
      summary: {
        month: monthNum,
        year: yearNum,
        taxPercentage,
        status: closure?.status || 'preview',
        clientsCount: closure?.clients.length || new Set(tasks.map(t => t.clientId)).size,
        tasksCount: tasks.length,
        isPreview: !closure
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get annual report data (JSON)
 */
export const getAnnualReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { year } = req.query;

    if (!year) {
      throw new AppError('Year is required', 400);
    }

    const yearNum = Number(year);

    // Get all closures for the year
    const closures = await prisma.monthlyClosures.findMany({
      where: {
        userId,
        year: yearNum
      },
      include: {
        clients: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        month: 'asc'
      }
    });

    // Calculate annual totals
    const annualTotals = {
      totalHours: 0,
      grossAmount: 0,
      taxAmount: 0,
      netAmount: 0
    };

    const monthlyBreakdown = closures.map(closure => {
      const monthTotals = closure.clients.reduce(
        (acc, clientData) => ({
          totalHours: acc.totalHours + Number(clientData.totalHours),
          grossAmount: acc.grossAmount + Number(clientData.grossAmount),
          taxAmount: acc.taxAmount + Number(clientData.taxAmount),
          netAmount: acc.netAmount + Number(clientData.netAmount)
        }),
        { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
      );

      annualTotals.totalHours += monthTotals.totalHours;
      annualTotals.grossAmount += monthTotals.grossAmount;
      annualTotals.taxAmount += monthTotals.taxAmount;
      annualTotals.netAmount += monthTotals.netAmount;

      return {
        month: closure.month,
        year: closure.year,
        status: closure.status,
        ...monthTotals
      };
    });

    // Get revenue by client for the year
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31);

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

    const clientBreakdown = Object.entries(hoursByClient)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.hours - a.hours);

    res.json({
      year: yearNum,
      annualTotals,
      monthlyBreakdown,
      clientBreakdown,
      summary: {
        year: yearNum,
        closuresCount: closures.length,
        clientsCount: clientBreakdown.length,
        tasksCount: tasks.length,
        averageMonthlyHours: annualTotals.totalHours / Math.max(closures.length, 1),
        averageMonthlyNetAmount: annualTotals.netAmount / Math.max(closures.length, 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate monthly report PDF
 */
export const generateMonthlyReportPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      throw new AppError('Month and year are required', 400);
    }

    const monthNum = Number(month);
    const yearNum = Number(year);

    // Get monthly closure
    const closure = await prisma.monthlyClosures.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: monthNum,
          year: yearNum
        }
      },
      include: {
        clients: {
          include: {
            client: true
          },
          orderBy: {
            client: {
              name: 'asc'
            }
          }
        }
      }
    });

    if (!closure) {
      throw new AppError('Monthly closure not found', 404);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Calculate totals
    const totals = closure.clients.reduce(
      (acc, clientData) => ({
        totalHours: acc.totalHours + Number(clientData.totalHours),
        grossAmount: acc.grossAmount + Number(clientData.grossAmount),
        taxAmount: acc.taxAmount + Number(clientData.taxAmount),
        netAmount: acc.netAmount + Number(clientData.netAmount)
      }),
      { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=monthly-report-${yearNum}-${String(monthNum).padStart(2, '0')}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('Monthly Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Period: ${getMonthName(monthNum)} ${yearNum}`, { align: 'center' });
    doc.fontSize(12).text(`Freelancer: ${user?.name}`, { align: 'center' });
    doc.moveDown(2);

    // Summary section
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Total Hours: ${totals.totalHours.toFixed(2)}h`);
    doc.text(`Gross Amount: R$ ${totals.grossAmount.toFixed(2)}`);
    doc.text(`Tax (${closure.taxPercentage}%): R$ ${totals.taxAmount.toFixed(2)}`);
    doc.text(`Net Amount: R$ ${totals.netAmount.toFixed(2)}`);
    doc.moveDown(2);

    // Clients breakdown
    doc.fontSize(16).text('Breakdown by Client', { underline: true });
    doc.moveDown();

    // Show closure's hourly rate
    doc.text(`Hourly Rate: R$ ${Number(closure.hourlyRate).toFixed(2)}/h`);
    doc.moveDown(2);

    closure.clients.forEach((clientData, index) => {
      doc.fontSize(12);
      doc.text(`${index + 1}. ${clientData.client.name}`, { underline: true });
      doc.fontSize(10);
      doc.text(`   Hours: ${Number(clientData.totalHours).toFixed(2)}h`);
      doc.text(`   Gross: R$ ${Number(clientData.grossAmount).toFixed(2)}`);
      doc.text(`   Tax: R$ ${Number(clientData.taxAmount).toFixed(2)}`);
      doc.text(`   Net: R$ ${Number(clientData.netAmount).toFixed(2)}`);
      doc.moveDown();
    });

    // Notes
    if (closure.notes) {
      doc.addPage();
      doc.fontSize(16).text('Notes', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(closure.notes);
    }

    // Footer
    doc.fontSize(8).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate annual report PDF
 */
export const generateAnnualReportPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.id;
    const { year } = req.query;

    if (!year) {
      throw new AppError('Year is required', 400);
    }

    const yearNum = Number(year);

    // Get all closures for the year
    const closures = await prisma.monthlyClosures.findMany({
      where: {
        userId,
        year: yearNum
      },
      include: {
        clients: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        month: 'asc'
      }
    });

    if (closures.length === 0) {
      throw new AppError('No closures found for this year', 404);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Calculate annual totals
    const annualTotals = {
      totalHours: 0,
      grossAmount: 0,
      taxAmount: 0,
      netAmount: 0
    };

    const monthlyData = closures.map(closure => {
      const monthTotals = closure.clients.reduce(
        (acc, clientData) => ({
          totalHours: acc.totalHours + Number(clientData.totalHours),
          grossAmount: acc.grossAmount + Number(clientData.grossAmount),
          taxAmount: acc.taxAmount + Number(clientData.taxAmount),
          netAmount: acc.netAmount + Number(clientData.netAmount)
        }),
        { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
      );

      annualTotals.totalHours += monthTotals.totalHours;
      annualTotals.grossAmount += monthTotals.grossAmount;
      annualTotals.taxAmount += monthTotals.taxAmount;
      annualTotals.netAmount += monthTotals.netAmount;

      return {
        month: closure.month,
        ...monthTotals
      };
    });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=annual-report-${yearNum}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('Annual Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Year: ${yearNum}`, { align: 'center' });
    doc.fontSize(12).text(`Freelancer: ${user?.name}`, { align: 'center' });
    doc.moveDown(2);

    // Annual summary
    doc.fontSize(16).text('Annual Summary', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Total Hours: ${annualTotals.totalHours.toFixed(2)}h`);
    doc.text(`Gross Amount: R$ ${annualTotals.grossAmount.toFixed(2)}`);
    doc.text(`Tax Amount: R$ ${annualTotals.taxAmount.toFixed(2)}`);
    doc.text(`Net Amount: R$ ${annualTotals.netAmount.toFixed(2)}`);
    doc.text(`Months with Closures: ${closures.length}`);
    doc.text(`Average Monthly Hours: ${(annualTotals.totalHours / closures.length).toFixed(2)}h`);
    doc.text(`Average Monthly Net: R$ ${(annualTotals.netAmount / closures.length).toFixed(2)}`);
    doc.moveDown(2);

    // Monthly breakdown
    doc.fontSize(16).text('Monthly Breakdown', { underline: true });
    doc.moveDown();

    monthlyData.forEach(data => {
      doc.fontSize(12);
      doc.text(`${getMonthName(data.month)} ${yearNum}`, { underline: true });
      doc.fontSize(10);
      doc.text(`   Hours: ${data.totalHours.toFixed(2)}h`);
      doc.text(`   Gross: R$ ${data.grossAmount.toFixed(2)}`);
      doc.text(`   Tax: R$ ${data.taxAmount.toFixed(2)}`);
      doc.text(`   Net: R$ ${data.netAmount.toFixed(2)}`);
      doc.moveDown();
    });

    // Footer
    doc.fontSize(8).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

// Helper function to get month name
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
