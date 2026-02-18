import { useState } from 'react';
import { Modal, Button } from '../common';
import { taskTypeService } from '../../services/taskTypeService';
import type { TaskType } from '../../types/taskType';

interface DeleteTaskTypeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskType: TaskType;
}

export default function DeleteTaskTypeConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  taskType,
}: DeleteTaskTypeConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await taskTypeService.delete(taskType.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting task type:', err);
      setError(err.response?.data?.error || 'Erro ao excluir tipo de tarefa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Confirmar Exclusão" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Tem certeza que deseja excluir este tipo de tarefa?
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded flex-shrink-0"
                style={{ backgroundColor: taskType.color }}
              />
              <p className="text-sm font-semibold">{taskType.name}</p>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Se existirem tarefas usando este tipo, ele será desativado. Caso contrário, será
              removido permanentemente.
            </p>
            <p className="text-sm text-gray-500">
              Tarefas existentes não serão afetadas.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Excluir Tipo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
