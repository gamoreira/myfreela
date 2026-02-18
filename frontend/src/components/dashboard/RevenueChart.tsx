import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthData } from '../../types/dashboard';
import { Card } from '../common';
import { useTheme } from '../../context/ThemeContext';

interface RevenueChartProps {
  data: MonthData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const { isDark } = useTheme();

  const chartData = data.map((month) => ({
    name: `${month.monthName}/${month.year.toString().slice(-2)}`,
    Horas: parseFloat(month.hours.toFixed(1)),
    Receita: parseFloat((month.revenue / 100).toFixed(2)), // Scale down for better visualization
  }));

  return (
    <Card title="Evolução Mensal" subtitle="Últimos 6 meses" padding="md">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
          <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#fff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Receita') {
                return `R$ ${(value * 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
              }
              return `${value}h`;
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="Horas" fill="#3B82F6" />
          <Bar yAxisId="right" dataKey="Receita" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
