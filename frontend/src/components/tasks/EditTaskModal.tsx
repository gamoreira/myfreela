import { useState } from 'react';
import { Modal } from '../common';
import TaskForm from './TaskForm';
import { taskService } from '../../services/taskService';
import type { CreateTaskDto, UpdateTaskDto, Task } from '../../types/task';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  task: Task;
}

export default function EditTaskModal({ isOpen, onClose, onSuccess, task }: EditTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedTask = await taskService.update(task.id, data as UpdateTaskDto);
      onSuccess(updatedTask);
      onClose();
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar tarefa');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Tarefa" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <TaskForm
        task={task}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
