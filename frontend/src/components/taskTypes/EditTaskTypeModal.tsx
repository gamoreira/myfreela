import { useState } from 'react';
import { Modal } from '../common';
import TaskTypeForm from './TaskTypeForm';
import { taskTypeService } from '../../services/taskTypeService';
import type { CreateTaskTypeDto, UpdateTaskTypeDto, TaskType } from '../../types/taskType';

interface EditTaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taskType: TaskType) => void;
  taskType: TaskType;
}

export default function EditTaskTypeModal({
  isOpen,
  onClose,
  onSuccess,
  taskType,
}: EditTaskTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTaskTypeDto | UpdateTaskTypeDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedTaskType = await taskTypeService.update(taskType.id, data as UpdateTaskTypeDto);
      onSuccess(updatedTaskType);
      onClose();
    } catch (err: any) {
      console.error('Error updating task type:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar tipo de tarefa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Tipo de Tarefa" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <TaskTypeForm
        taskType={taskType}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
