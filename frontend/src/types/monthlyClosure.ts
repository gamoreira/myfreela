export interface MonthlyClosureClient {
  id: string;
  monthlyClosureId: string;
  clientId: string;
  totalHours: number;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
    isActive?: boolean;
  };
}

export interface MonthlyClosureExpense {
  id: string;
  monthlyClosureId: string;
  expenseId: string | null;
  name: string;
  description: string | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
  expense: {
    id: string;
    name: string;
  } | null;
}

export interface MonthlyClosure {
  id: string;
  userId: string;
  month: number;
  year: number;
  taxPercentage: number;
  hourlyRate: number;
  notes: string | null;
  status: 'open' | 'closed';
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clients: MonthlyClosureClient[];
  expenses: MonthlyClosureExpense[];
  hasPendingTasks?: boolean;
  pendingTasksCount?: number;
  hasTasksWithoutHours?: boolean;
  tasksWithoutHoursCount?: number;
  totalExpenses?: number;
}

export interface MonthlyClosureWithTotals extends MonthlyClosure {
  totals: {
    totalHours: number;
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
    totalExpenses: number;
    finalAmount: number;
  };
}

export interface CreateMonthlyClosureDto {
  month: number;
  year: number;
  taxPercentage: number;
  hourlyRate: number;
  notes?: string;
  expenseIds?: string[];
  expenses?: Array<{ expenseId: string; amount: number }>;
}

export interface AddClosureExpenseDto {
  expenseId?: string;
  name?: string;
  description?: string;
  amount?: number;
}

export interface UpdateClosureExpenseDto {
  name?: string;
  description?: string;
  amount?: number;
}

export interface UpdateMonthlyClosureDto {
  taxPercentage?: number;
  hourlyRate?: number;
  notes?: string;
}

export interface MonthlyClosuresResponse {
  closures: MonthlyClosure[];
  total: number;
}

export interface MonthlyClosureDetailsResponse {
  closure: MonthlyClosureWithTotals;
}
