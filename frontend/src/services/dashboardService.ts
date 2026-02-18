import api from './api';
import {
  DashboardOverview,
  RevenueStats,
  ProductivityStats,
  MonthlyComparison,
} from '../types/dashboard';

export const dashboardService = {
  /**
   * Get dashboard overview with key metrics
   */
  async getOverview(): Promise<DashboardOverview> {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  /**
   * Get revenue statistics for a period
   */
  async getRevenueStats(startDate?: string, endDate?: string): Promise<RevenueStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/dashboard/revenue?${params.toString()}`);
    return response.data;
  },

  /**
   * Get productivity statistics by task type
   */
  async getProductivityStats(startDate?: string, endDate?: string): Promise<ProductivityStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/dashboard/productivity?${params.toString()}`);
    return response.data;
  },

  /**
   * Get monthly comparison (current vs previous months)
   */
  async getMonthlyComparison(months: number = 6): Promise<MonthlyComparison> {
    const response = await api.get(`/dashboard/monthly-comparison?months=${months}`);
    return response.data;
  },
};
