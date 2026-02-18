import { useState } from 'react';
import { Modal } from '../common';
import MonthlyClosureForm from './MonthlyClosureForm';
import { monthlyClosureService } from '../../services/monthlyClosureService';
import type { CreateMonthlyClosureDto, UpdateMonthlyClosureDto, MonthlyClosure } from '../../types/monthlyClosure';

interface CreateMonthlyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (closure: MonthlyClosure) => void;
}

export default function CreateMonthlyClosureModal({ isOpen, onClose,  onSuccess }: CreateMonthlyClosureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateMonthlyClosureDto | UpdateMonthlyClosureDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newClosure = await monthlyClosureService.create(data as CreateMonthlyClosureDto);
      onSuccess(newClosure);
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar o faturamento mensal:', err);
      setError(err.response?.data?.error || 'Erro ao criar faturamento mensal');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Faturamento" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <MonthlyClosureForm onSubmit={handleSubmit} onCancel={handleClose} isLoading={isLoading} />
    </Modal>
  );
}
