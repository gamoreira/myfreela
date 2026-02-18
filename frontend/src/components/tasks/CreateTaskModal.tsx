import { useState } from 'react';
import { Modal } from '../common';
import TaskForm from './TaskForm';
import { taskService } from '../../services/taskService';
import type { CreateTaskDto, UpdateTaskDto, Task } from '../../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newTask = await taskService.create(data as CreateTaskDto);
      onSuccess(newTask);
      onClose();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Erro ao criar tarefa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Tarefa" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <TaskForm onSubmit={handleSubmit} onCancel={handleClose} isLoading={isLoading} />
    </Modal>
  );
}
