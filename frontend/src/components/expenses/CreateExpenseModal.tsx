import { useState } from 'react';
import { Modal } from '../common';
import ExpenseForm from './ExpenseForm';
import { expenseService } from '../../services/expenseService';
import type { CreateExpenseDto, UpdateExpenseDto, Expense } from '../../types/expense';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expense: Expense) => void;
}

export default function CreateExpenseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateExpenseDto | UpdateExpenseDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newExpense = await expenseService.create(data as CreateExpenseDto);
      onSuccess(newExpense);
      onClose();
    } catch (err: any) {
      console.error('Error creating expense:', err);
      setError(err.response?.data?.error || 'Erro ao criar despesa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Nova Despesa" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Dica</h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Despesas recorrentes podem ser adicionadas automaticamente aos faturamentos.
              Use para despesas fixas como contador, escritorio, etc.
            </p>
          </div>
        </div>
      </div>

      <ExpenseForm onSubmit={handleSubmit} onCancel={handleClose} isLoading={isLoading} />
    </Modal>
  );
}
