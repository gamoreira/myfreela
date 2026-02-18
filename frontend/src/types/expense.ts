export interface Expense {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  amount: number;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  name: string;
  description?: string;
  amount: number;
  isRecurring?: boolean;
}

export interface UpdateExpenseDto {
  name?: string;
  description?: string;
  amount?: number;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface ExpensesResponse {
  expenses: Expense[];
  total: number;
}

export interface ExpenseResponse {
  expense: Expense;
}
