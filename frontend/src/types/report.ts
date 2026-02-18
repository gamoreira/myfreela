import type { Task } from './task';
import type { MonthlyClosure } from './monthlyClosure';

export interface ReportTotals {
  totalHours: number;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
}

export interface MonthlyReportSummary {
  month: number;
  year: number;
  taxPercentage: number | string;
  status: string;
  clientsCount: number;
  tasksCount: number;
  isPreview?: boolean;
}

export interface MonthlyReportResponse {
  closure: MonthlyClosure | null;
  tasks: Task[];
  totals: ReportTotals;
  summary: MonthlyReportSummary;
}

export interface MonthlyBreakdown {
  month: number;
  year: number;
  status: string;
  totalHours: number;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
}

export interface ClientRevenue {
  name: string;
  hours: number;
  revenue: number;
}

export interface AnnualReportResponse {
  year: number;
  closures: MonthlyClosure[];
  monthlyBreakdown: MonthlyBreakdown[];
  annualTotals: ReportTotals;
  revenueByClient: Record<string, ClientRevenue>;
  summary: {
    year: number;
    closuresCount: number;
    averageMonthlyRevenue: number;
    totalClients: number;
  };
}

export interface ReportFilters {
  month?: number;
  year: number;
}
