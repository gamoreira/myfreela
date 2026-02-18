import { useState } from 'react';
import { Modal, Button } from '../common';
import { monthlyClosureService } from '../../services/monthlyClosureService';
import type { MonthlyClosure } from '../../types/monthlyClosure';

interface DeleteMonthlyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  closure: MonthlyClosure;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DeleteMonthlyClosureModal({ isOpen, onClose, onSuccess, closure }: DeleteMonthlyClosureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await monthlyClosureService.delete(closure.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao deletar o faturamento:', err);
      setError(err.response?.data?.error || 'Erro ao excluir faturamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotals = () => {
    return closure.clients.reduce(
      (acc, client) => ({
        totalHours: acc.totalHours + Number(client.totalHours),
        netAmount: acc.netAmount + Number(client.netAmount),
      }),
      { totalHours: 0, netAmount: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Confirmar Exclusão" size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Tem certeza que deseja excluir este faturamento?
            </h4>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3 mb-3">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {MONTH_NAMES[closure.month - 1]} {closure.year}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      closure.status === 'closed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {closure.status === 'closed' ? 'Fechado' : 'Aberto'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Imposto: {closure.taxPercentage}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">Clientes</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{closure.clients.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">Horas</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {totals.totalHours.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">Líquido</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(totals.netAmount)}
                  </p>
                </div>
              </div>

              {closure.notes && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium mb-1">Observações:</p>
                  <p className="line-clamp-2">{closure.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Atenção:</strong> Esta ação é permanente e não pode ser desfeita. Todos os
                dados relacionados a este faturamento serão excluídos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Excluir Faturamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
