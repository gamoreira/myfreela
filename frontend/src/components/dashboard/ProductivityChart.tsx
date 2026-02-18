import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TaskTypeStats } from '../../types/dashboard';
import { Card } from '../common';
import { useTheme } from '../../context/ThemeContext';

interface ProductivityChartProps {
  data: TaskTypeStats[];
}

export default function ProductivityChart({ data }: ProductivityChartProps) {
  const { isDark } = useTheme();

  const chartData = data.map((type) => ({
    name: type.name,
    value: parseFloat(type.hours.toFixed(1)),
    color: type.color,
    percentage: type.percentage.toFixed(1),
  }));

  return (
    <Card title="Distribuição por Tipo" subtitle="Horas por tipo de tarefa" padding="md">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.percentage}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
              formatter={(value: number) => `${value}h`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
        </div>
      )}
    </Card>
  );
}
