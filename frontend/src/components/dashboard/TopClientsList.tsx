import { TopClient } from '../../types/dashboard';
import { Card } from '../common';

interface TopClientsListProps {
  clients: TopClient[];
}

export default function TopClientsList({ clients }: TopClientsListProps) {
  return (
    <Card title="Top Clientes do Mês" subtitle="Por horas trabalhadas" padding="md">
      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                      : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}
                >
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{client.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{client.hours.toFixed(1)} horas</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600 dark:text-green-400">
                  R$ {client.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhum cliente com horas registradas</p>
        </div>
      )}
    </Card>
  );
}
