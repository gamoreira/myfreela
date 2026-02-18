import api from './api';
import type {
  MonthlyReportResponse,
  AnnualReportResponse,
} from '../types/report';

export const reportService = {
  /**
   * Get monthly report data
   */
  async getMonthlyReport(month: number, year: number): Promise<MonthlyReportResponse> {
    const response = await api.get<MonthlyReportResponse>(
      `/reports/monthly?month=${month}&year=${year}`
    );
    return response.data;
  },

  /**
   * Get annual report data
   */
  async getAnnualReport(year: number): Promise<AnnualReportResponse> {
    const response = await api.get<AnnualReportResponse>(`/reports/annual?year=${year}`);
    return response.data;
  },

  /**
   * Download monthly report PDF
   */
  async downloadMonthlyPDF(month: number, year: number): Promise<void> {
    const response = await api.get(`/reports/monthly/pdf?month=${month}&year=${year}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-mensal-${year}-${month.toString().padStart(2, '0')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download annual report PDF
   */
  async downloadAnnualPDF(year: number): Promise<void> {
    const response = await api.get(`/reports/annual/pdf?year=${year}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-anual-${year}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
