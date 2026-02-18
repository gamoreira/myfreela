import { useState } from 'react';
import { Modal, Button } from '../common';
import { hourRecordService } from '../../services/hourRecordService';
import type { HourRecord } from '../../types/hourRecord';

interface DeleteHourRecordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hourRecord: HourRecord;
}

export default function DeleteHourRecordConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  hourRecord,
}: DeleteHourRecordConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await hourRecordService.delete(hourRecord.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting hour record:', err);
      setError(err.response?.data?.error || 'Erro ao deletar registro');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Confirmar Exclusão" size="sm">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
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
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Tem certeza que deseja deletar este registro de horas?
            </h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>
                <span className="font-medium">Data:</span> {formatDate(hourRecord.workDate)}
              </p>
              <p>
                <span className="font-medium">Horas:</span> {Number(hourRecord.hoursWorked).toFixed(2)}h
              </p>
              {hourRecord.task && (
                <p>
                  <span className="font-medium">Tarefa:</span> {hourRecord.task.taskNumber} -{' '}
                  {hourRecord.task.name}
                </p>
              )}
              {hourRecord.description && (
                <p>
                  <span className="font-medium">Descrição:</span> {hourRecord.description}
                </p>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isLoading}
          >
            Deletar Registro
          </Button>
        </div>
      </div>
    </Modal>
  );
}
