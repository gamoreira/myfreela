import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import Loading from '../components/Loading';
import {
  StatsCards,
  RevenueChart,
  ProductivityChart,
  RecentTasksList,
  TopClientsList,
} from '../components/dashboard';
import type {
  DashboardOverview,
  MonthlyComparison,
  ProductivityStats,
} from '../types/dashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyComparison | null>(null);
  const [productivityData, setProductivityData] = useState<ProductivityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, monthlyDataResult, productivityDataResult] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getMonthlyComparison(6),
        dashboardService.getProductivityStats(),
      ]);

      setOverview(overviewData);
      setMonthlyData(monthlyDataResult);
      setProductivityData(productivityDataResult);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading size="lg" text="Carregando dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar dashboard!</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  if (!overview || !monthlyData || !productivityData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível!</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Olá, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Bem-vindo ao seu painel de controle - {overview.currentMonth.month}/{overview.currentMonth.year}
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalHours={overview.currentMonth.hours}
          totalClients={overview.totalClients}
          pendingTasks={overview.currentMonth.pendingTasks}
          totalRevenue={overview.currentMonth.revenue}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={monthlyData.months} />
          <ProductivityChart data={productivityData.byTaskType} />
        </div>

        {/* Recent Activity and Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTasksList tasks={overview.recentTasks} />
          <TopClientsList clients={overview.topClients} />
        </div>
      </div>
    </Layout>
  );
}
