import { useState, useEffect } from 'react';
import { Modal, Button } from '../common';
import Loading from '../Loading';
import { monthlyClosureService } from '../../services/monthlyClosureService';
import type { MonthlyClosure, MonthlyClosureWithTotals } from '../../types/monthlyClosure';

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  closure: MonthlyClosure;
  onGeneratePDF?: (closure: MonthlyClosure) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ViewDetailsModal({
  isOpen,
  onClose,
  closure,
  onGeneratePDF,
}: ViewDetailsModalProps) {
  const [closureDetails, setClosureDetails] = useState<MonthlyClosureWithTotals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && closure) {
      loadDetails();
    }
  }, [isOpen, closure]);

  const loadDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const details = await monthlyClosureService.getById(closure.id);
      setClosureDetails(details);
    } catch (err: any) {
      console.error('Error loading closure details:', err);
      setError(err.response?.data?.error || 'Erro ao carregar detalhes do faturamento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Faturamento" size="xl">
      {isLoading && (
        <div className="py-12">
          <Loading size="lg" text="Carregando detalhes..." />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && closureDetails && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {MONTH_NAMES[closureDetails.month - 1]} {closureDetails.year}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      closureDetails.status === 'closed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {closureDetails.status === 'closed' ? 'Fechado' : 'Aberto'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Imposto: {closureDetails.taxPercentage}% | Valor/Hora: {formatCurrency(closureDetails.hourlyRate)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Criado em: {formatDate(closureDetails.createdAt)}
                </p>
                {closureDetails.closedAt && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Fechado em: {formatDate(closureDetails.closedAt)}
                  </p>
                )}
              </div>
            </div>

            {closureDetails.notes && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Observações:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{closureDetails.notes}</p>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total de Horas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {closureDetails.totals.totalHours.toFixed(1)}h
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Valor Bruto</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(closureDetails.totals.grossAmount)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Impostos</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(closureDetails.totals.taxAmount)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Valor Liquido</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(closureDetails.totals.netAmount)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Despesas</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(closureDetails.totals.totalExpenses)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border-2 ${closureDetails.totals.finalAmount >= 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'}`}>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Valor Final</p>
              <p className={`text-xl font-bold ${closureDetails.totals.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(closureDetails.totals.finalAmount)}
              </p>
            </div>
          </div>

          {/* Clients Table */}
          {closureDetails.clients.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Detalhamento por Cliente ({closureDetails.clients.length})
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                        Valor Bruto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Impostos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor Liquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {closureDetails.clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {client.client.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {Number(client.totalHours).toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Number(client.grossAmount))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                          {formatCurrency(Number(client.taxAmount))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                          {formatCurrency(Number(client.netAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          {closureDetails.expenses && closureDetails.expenses.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Despesas ({closureDetails.expenses.length})
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Despesa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descricao
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {closureDetails.expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {expense.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {expense.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 text-right">
                        Total de Despesas:
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                        {formatCurrency(closureDetails.totals.totalExpenses)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Empty state if no clients and no expenses */}
          {closureDetails.clients.length === 0 && (!closureDetails.expenses || closureDetails.expenses.length === 0) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Este faturamento nao possui clientes nem despesas.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            {onGeneratePDF && (
              <Button
                variant="secondary"
                onClick={() => onGeneratePDF(closure)}
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
                Gerar PDF
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
