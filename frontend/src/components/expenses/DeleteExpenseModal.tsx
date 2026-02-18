import { useState } from 'react';
import { Modal, Button } from '../common';
import { expenseService } from '../../services/expenseService';
import type { Expense } from '../../types/expense';

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense;
}

export default function DeleteExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: DeleteExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await expenseService.delete(expense.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setError(err.response?.data?.error || 'Erro ao excluir despesa');
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Excluir Despesa" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
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

          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Desativar despesa?
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tem certeza que deseja desativar a despesa{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{expense.name}</span>?
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Valor:</span> {formatCurrency(expense.amount)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Tipo:</span>{' '}
              {expense.isRecurring ? 'Recorrente' : 'Avulso'}
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            A despesa sera desativada e nao aparecera mais nas listagens.
            Ela continuara vinculada aos faturamentos existentes.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Desativar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
