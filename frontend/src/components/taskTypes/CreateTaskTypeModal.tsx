import { useState } from 'react';
import { Modal } from '../common';
import TaskTypeForm from './TaskTypeForm';
import { taskTypeService } from '../../services/taskTypeService';
import type { CreateTaskTypeDto, UpdateTaskTypeDto, TaskType } from '../../types/taskType';

interface CreateTaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taskType: TaskType) => void;
}

export default function CreateTaskTypeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTaskTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTaskTypeDto | UpdateTaskTypeDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newTaskType = await taskTypeService.create(data as CreateTaskTypeDto);
      onSuccess(newTaskType);
      onClose();
    } catch (err: any) {
      console.error('Error creating task type:', err);
      setError(err.response?.data?.error || 'Erro ao criar tipo de tarefa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Tipo de Tarefa" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <TaskTypeForm onSubmit={handleSubmit} onCancel={handleClose} isLoading={isLoading} />
    </Modal>
  );
}
