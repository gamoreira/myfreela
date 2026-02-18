import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Button, Card, Select } from '../components/common';
import { reportService } from '../services/reportService';
import Loading from '../components/Loading';
import type { MonthlyReportResponse, AnnualReportResponse } from '../types/report';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function Reports() {
  const currentDate = new Date();
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportResponse | null>(null);
  const [annualReport, setAnnualReport] = useState<AnnualReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Available years (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    if (activeTab === 'monthly') {
      loadMonthlyReport();
    } else {
      loadAnnualReport();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const loadMonthlyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getMonthlyReport(selectedMonth, selectedYear);
      setMonthlyReport(data);
    } catch (err: any) {
      console.error('Error loading monthly report:', err);
      setError(err.response?.data?.error || 'Erro ao carregar relatório mensal');
      setMonthlyReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getAnnualReport(selectedYear);
      setAnnualReport(data);
    } catch (err: any) {
      console.error('Error loading annual report:', err);
      setError(err.response?.data?.error || 'Erro ao carregar relatório anual');
      setAnnualReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      if (activeTab === 'monthly') {
        await reportService.downloadMonthlyPDF(selectedMonth, selectedYear);
      } else {
        await reportService.downloadAnnualPDF(selectedYear);
      }
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Erro ao baixar PDF. Verifique se o relatório existe.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Visualize relatórios e estatísticas detalhadas</p>
          </div>
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            isLoading={downloadingPDF}
            disabled={activeTab === 'monthly' && monthlyReport?.summary.isPreview}
            title={
              activeTab === 'monthly' && monthlyReport?.summary.isPreview
                ? 'Faça o faturamento para baixar o PDF'
                : undefined
            }
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            }
          >
            Baixar PDF
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Relatório Mensal
            </button>
            <button
              onClick={() => setActiveTab('annual')}
              className={`${
                activeTab === 'annual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Relatório Anual
            </button>
          </nav>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'monthly' && (
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                options={MONTHS.map((m) => ({ value: String(m.value), label: m.label }))}
              />
            )}
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="py-12">
            <Loading size="lg" text="Carregando relatório..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card padding="md">
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar relatório</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </Card>
        )}

        {/* Monthly Report Content */}
        {activeTab === 'monthly' && monthlyReport && !loading && (
          <div className="space-y-6">
            {/* Preview Banner */}
            {monthlyReport.summary.isPreview && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Prévia do Relatório
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Este período ainda não possui faturamento. Os valores exibidos são estimativas
                      baseadas nas tarefas registradas. Para gerar o relatório oficial, faça o
                      faturamento mensal em "Faturamentos".
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {Number(monthlyReport.totals.totalHours).toFixed(1)}h
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Bruto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(monthlyReport.totals.grossAmount)}
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Impostos</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(monthlyReport.totals.taxAmount)}
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Líquido</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(monthlyReport.totals.netAmount)}
                </p>
              </Card>
            </div>

            {/* Tasks Table */}
            <Card title="Tarefas do Período" padding="md">
              {monthlyReport.tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Horas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {monthlyReport.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {formatDate(task.creationDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{task.client.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="px-2 py-1 text-xs font-medium rounded"
                              style={{
                                backgroundColor: `${task.taskType.color}20`,
                                color: task.taskType.color,
                              }}
                            >
                              {task.taskType.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                            {task.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {Number(task.hoursSpent).toFixed(1)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Nenhuma tarefa registrada neste período
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Annual Report Content */}
        {activeTab === 'annual' && annualReport && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {Number(annualReport.annualTotals.totalHours).toFixed(1)}h
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Bruto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(annualReport.annualTotals.grossAmount)}
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Impostos</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(annualReport.annualTotals.taxAmount)}
                </p>
              </Card>
              <Card padding="md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Líquido</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(annualReport.annualTotals.netAmount)}
                </p>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card title="Evolução Mensal" padding="md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Mês
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Horas
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Bruto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Impostos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {annualReport.monthlyBreakdown && annualReport.monthlyBreakdown.length > 0 ? (
                      annualReport.monthlyBreakdown.map((month) => (
                        <tr key={month.month} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {MONTHS[month.month - 1].label}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {Number(month.totalHours).toFixed(1)}h
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(month.grossAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                            {formatCurrency(month.taxAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                            {formatCurrency(month.netAmount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          Nenhum faturamento encontrado para este ano
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Revenue by Client */}
            <Card title="Faturamento por Cliente" padding="md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Horas
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Faturamento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        % do Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {annualReport.revenueByClient && Object.keys(annualReport.revenueByClient).length > 0 ? (
                      Object.values(annualReport.revenueByClient)
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((client) => (
                          <tr key={client.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {client.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                              {Number(client.hours).toFixed(1)}h
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                              {formatCurrency(client.revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                              {((client.revenue / Number(annualReport.annualTotals.grossAmount)) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          Nenhum cliente encontrado para este ano
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
