import api from './api';
import type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpensesResponse,
  ExpenseResponse,
} from '../types/expense';

export const expenseService = {
  /**
   * Get all expenses (active by default)
   */
  async getAll(includeInactive = false): Promise<Expense[]> {
    const response = await api.get<ExpensesResponse>('/expenses', {
      params: { includeInactive: includeInactive ? 'true' : 'false' }
    });
    return response.data.expenses;
  },

  /**
   * Get expense by ID
   */
  async getById(id: string): Promise<Expense> {
    const response = await api.get<ExpenseResponse>(`/expenses/${id}`);
    return response.data.expense;
  },

  /**
   * Create new expense
   */
  async create(data: CreateExpenseDto): Promise<Expense> {
    const response = await api.post<{ message: string; expense: Expense }>(
      '/expenses',
      data
    );
    return response.data.expense;
  },

  /**
   * Update expense
   */
  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const response = await api.put<{ message: string; expense: Expense }>(
      `/expenses/${id}`,
      data
    );
    return response.data.expense;
  },

  /**
   * Delete expense (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
