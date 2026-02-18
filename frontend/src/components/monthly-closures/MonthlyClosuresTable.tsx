import { Button } from '../common';
import type { MonthlyClosure } from '../../types/monthlyClosure';

interface MonthlyClosuresTableProps {
  closures: MonthlyClosure[];
  onView: (closure: MonthlyClosure) => void;
  onEdit: (closure: MonthlyClosure) => void;
  onToggleStatus: (closure: MonthlyClosure) => void;
  onDelete: (closure: MonthlyClosure) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthlyClosuresTable({
  closures,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: MonthlyClosuresTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotals = (closure: MonthlyClosure) => {
    const clientTotals = closure.clients.reduce(
      (acc, client) => ({
        totalHours: acc.totalHours + Number(client.totalHours),
        grossAmount: acc.grossAmount + Number(client.grossAmount),
        taxAmount: acc.taxAmount + Number(client.taxAmount),
        netAmount: acc.netAmount + Number(client.netAmount),
      }),
      { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
    );
    const totalExpenses = closure.totalExpenses
      ?? closure.expenses?.reduce((acc, e) => acc + Number(e.amount), 0)
      ?? 0;
    return {
      ...clientTotals,
      totalExpenses,
      finalAmount: clientTotals.netAmount - totalExpenses,
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clientes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Horas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Bruto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Impostos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Líquido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Despesas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Final
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {closures.length > 0 ? (
              closures.map((closure) => {
                const totals = calculateTotals(closure);
                return (
                  <tr key={closure.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* Period */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {MONTH_NAMES[closure.month - 1]} {closure.year}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Imposto: {closure.taxPercentage}%
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <button
                          onClick={() => onToggleStatus(closure)}
                          className="group relative"
                          disabled={closure.status === 'open' && (closure.hasPendingTasks || closure.hasTasksWithoutHours)}
                          title={
                            closure.status === 'open' && (closure.hasPendingTasks || closure.hasTasksWithoutHours)
                              ? `Não é possível fechar: ${
                                  [
                                    closure.hasPendingTasks && `${closure.pendingTasksCount} pendente(s)`,
                                    closure.hasTasksWithoutHours && `${closure.tasksWithoutHoursCount} sem horas`,
                                  ]
                                    .filter(Boolean)
                                    .join(', ')
                                }`
                              : `Marcar como ${closure.status === 'closed' ? 'aberto' : 'fechado'}`
                          }
                        >
                          {closure.status === 'closed' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors">
                              <svg className="w-3 h-3 mr-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Fechado
                            </span>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                              closure.hasPendingTasks || closure.hasTasksWithoutHours
                                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 cursor-not-allowed opacity-75'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/60'
                            }`}>
                              <svg className="w-3 h-3 mr-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Aberto
                            </span>
                          )}
                        </button>
                        {closure.status === 'open' && (closure.hasPendingTasks || closure.hasTasksWithoutHours) && (
                          <div className="space-y-0.5">
                            {closure.hasPendingTasks && (
                              <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {closure.pendingTasksCount} pendente(s)
                              </div>
                            )}
                            {closure.hasTasksWithoutHours && (
                              <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {closure.tasksWithoutHoursCount} sem horas
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Number of Clients */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{closure.clients.length}</div>
                    </td>

                    {/* Total Hours */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {totals.totalHours.toFixed(1)}h
                      </div>
                    </td>

                    {/* Gross Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(totals.grossAmount)}
                      </div>
                    </td>

                    {/* Tax Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(totals.taxAmount)}
                      </div>
                    </td>

                    {/* Net Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totals.netAmount)}
                      </div>
                    </td>

                    {/* Expenses */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {totals.totalExpenses > 0 ? formatCurrency(totals.totalExpenses) : '-'}
                      </div>
                    </td>

                    {/* Final Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(totals.finalAmount)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onView(closure)}
                          title="Ver detalhes"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(closure)}
                          title="Editar faturamento"
                          disabled={closure.status === 'closed'}
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          }
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(closure)}
                          title="Excluir faturamento"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">Nenhum faturamento encontrado</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
