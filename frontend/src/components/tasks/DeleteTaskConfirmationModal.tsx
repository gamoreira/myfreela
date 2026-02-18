import { useState } from 'react';
import { Modal, Button } from '../common';
import { taskService } from '../../services/taskService';
import type { Task } from '../../types/task';

interface DeleteTaskConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task;
}

export default function DeleteTaskConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  task,
}: DeleteTaskConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await taskService.delete(task.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.error || 'Erro ao excluir tarefa');
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
      timeZone: 'UTC',
    });
  };

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
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
              Tem certeza que deseja excluir esta tarefa?
            </h4>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: `${task.taskType.color}20`,
                    color: task.taskType.color,
                  }}
                >
                  {task.taskType.name}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">{task.client.name}</span>
              </div>
              <p className="text-sm text-gray-900 font-medium line-clamp-2">{task.name}</p>
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{task.hoursSpent}h</span>
                <span>•</span>
                <span>{formatDate(task.creationDate)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Esta ação é permanente e não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Excluir Tarefa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
