import { useState } from 'react';
import { Modal } from '../common';
import ExpenseForm from './ExpenseForm';
import { expenseService } from '../../services/expenseService';
import type { CreateExpenseDto, UpdateExpenseDto, Expense } from '../../types/expense';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expense: Expense) => void;
  expense: Expense;
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: EditExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateExpenseDto | UpdateExpenseDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedExpense = await expenseService.update(expense.id, data as UpdateExpenseDto);
      onSuccess(updatedExpense);
      onClose();
    } catch (err: any) {
      console.error('Error updating expense:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar despesa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Despesa" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <ExpenseForm
        expense={expense}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
