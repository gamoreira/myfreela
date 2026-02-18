import api from './api';
import type {
  MonthlyClosure,
  MonthlyClosureWithTotals,
  MonthlyClosureExpense,
  CreateMonthlyClosureDto,
  UpdateMonthlyClosureDto,
  AddClosureExpenseDto,
  UpdateClosureExpenseDto,
  MonthlyClosuresResponse,
  MonthlyClosureDetailsResponse,
} from '../types/monthlyClosure';

export const monthlyClosureService = {
  /**
   * Get all monthly closures
   */
  async getAll(): Promise<MonthlyClosure[]> {
    const response = await api.get<MonthlyClosuresResponse>('/monthly-closures');
    return response.data.closures;
  },

  /**
   * Get monthly closure by ID with details
   */
  async getById(id: string): Promise<MonthlyClosureWithTotals> {
    const response = await api.get<MonthlyClosureDetailsResponse>(`/monthly-closures/${id}`);
    return response.data.closure;
  },

  /**
   * Create new monthly closure
   */
  async create(data: CreateMonthlyClosureDto): Promise<MonthlyClosure> {
    const response = await api.post<{ message: string; closure: MonthlyClosure }>(
      '/monthly-closures',
      data
    );
    return response.data.closure;
  },

  /**
   * Update monthly closure (notes and taxPercentage only)
   */
  async update(id: string, data: UpdateMonthlyClosureDto): Promise<MonthlyClosure> {
    const response = await api.put<{ message: string; closure: MonthlyClosure }>(
      `/monthly-closures/${id}`,
      data
    );
    return response.data.closure;
  },

  /**
   * Close monthly closure
   */
  async close(id: string): Promise<MonthlyClosure> {
    const response = await api.patch<{ message: string; closure: MonthlyClosure }>(
      `/monthly-closures/${id}/close`
    );
    return response.data.closure;
  },

  /**
   * Reopen monthly closure
   */
  async reopen(id: string): Promise<MonthlyClosure> {
    const response = await api.patch<{ message: string; closure: MonthlyClosure }>(
      `/monthly-closures/${id}/reopen`
    );
    return response.data.closure;
  },

  /**
   * Delete monthly closure
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/monthly-closures/${id}`);
  },

  /**
   * Add expense to monthly closure
   */
  async addExpense(closureId: string, data: AddClosureExpenseDto): Promise<MonthlyClosureExpense> {
    const response = await api.post<{ message: string; expense: MonthlyClosureExpense }>(
      `/monthly-closures/${closureId}/expenses`,
      data
    );
    return response.data.expense;
  },

  /**
   * Update expense in monthly closure
   */
  async updateExpense(
    closureId: string,
    expenseId: string,
    data: UpdateClosureExpenseDto
  ): Promise<MonthlyClosureExpense> {
    const response = await api.put<{ message: string; expense: MonthlyClosureExpense }>(
      `/monthly-closures/${closureId}/expenses/${expenseId}`,
      data
    );
    return response.data.expense;
  },

  /**
   * Remove expense from monthly closure
   */
  async removeExpense(closureId: string, expenseId: string): Promise<void> {
    await api.delete(`/monthly-closures/${closureId}/expenses/${expenseId}`);
  },
};
