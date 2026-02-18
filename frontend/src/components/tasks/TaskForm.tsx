import { useState, FormEvent, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../../types/task';
import type { Client } from '../../types/client';
import type { TaskType } from '../../types/taskType';
import { clientService } from '../../services/clientService';
import { taskTypeService } from '../../services/taskTypeService';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskForm({ task, onSubmit, onCancel, isLoading = false }: TaskFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    clientId: task?.clientId || '',
    taskTypeId: task?.taskTypeId || '',
    taskNumber: task?.taskNumber || '',
    name: task?.name || '',
    description: task?.description || '',
    estimatedHours: task?.estimatedHours != null ? Number(task.estimatedHours).toFixed(2) : '',
    creationDate: task?.creationDate ? task.creationDate.split('T')[0] : new Date().toISOString().split('T')[0],
    status: task?.status || 'pending' as 'pending' | 'completed',
  });

  const [errors, setErrors] = useState<{
    clientId?: string;
    taskTypeId?: string;
    taskNumber?: string;
    name?: string;
    description?: string;
    creationDate?: string;
    status?: string;
  }>({});

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [clientsData, taskTypesData] = await Promise.all([
        clientService.getAll(),
        taskTypeService.getAll(),
      ]);
      setClients(clientsData.filter((c) => c.isActive));
      setTaskTypes(taskTypesData.filter((tt) => tt.isActive));
    } catch (err) {
      console.error('Error loading form data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.taskTypeId) {
      newErrors.taskTypeId = 'Tipo de tarefa é obrigatório';
    }

    if (!formData.taskNumber.trim()) {
      newErrors.taskNumber = 'Número da tarefa é obrigatório';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da tarefa é obrigatório';
    }

    if (formData.description.trim() && formData.description.trim().length < 5) {
      newErrors.description = 'Descrição deve ter pelo menos 5 caracteres';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Descrição deve ter no máximo 1000 caracteres';
    }

    if (!formData.creationDate) {
      newErrors.creationDate = 'Data de criação é obrigatória';
    } else {
      const creationDate = new Date(formData.creationDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (creationDate > today) {
        newErrors.creationDate = 'Data de criação não pode ser no futuro';
      }
    }

    // Validate that task has hours registered before marking as completed
    if (formData.status === 'completed' && task && task.hoursSpent === 0) {
      newErrors.status = 'Não é possível concluir uma tarefa sem horas registradas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateTaskDto | UpdateTaskDto = {
      clientId: formData.clientId,
      taskTypeId: formData.taskTypeId,
      taskNumber: formData.taskNumber.trim(),
      name: formData.name.trim(),
      ...(formData.description.trim() && { description: formData.description.trim() }),
      ...(formData.estimatedHours && { estimatedHours: parseFloat(formData.estimatedHours) }),
      creationDate: new Date(formData.creationDate).toISOString(),
      status: formData.status,
    };

    await onSubmit(data);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Cliente"
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          error={errors.clientId}
          disabled={isLoading}
          required
          options={clients.map((client) => ({
            value: client.id,
            label: client.name,
          }))}
          placeholder="Selecione um cliente"
        />

        <Select
          label="Tipo de Tarefa"
          value={formData.taskTypeId}
          onChange={(e) => setFormData({ ...formData, taskTypeId: e.target.value })}
          error={errors.taskTypeId}
          disabled={isLoading}
          required
          options={taskTypes.map((type) => ({
            value: type.id,
            label: type.name,
          }))}
          placeholder="Selecione um tipo"
        />
      </div>

      <Input
        label="Nome da Tarefa"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        disabled={isLoading}
        required
        placeholder="ex: Desenvolvimento Frontend"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Número/Código"
          type="text"
          value={formData.taskNumber}
          onChange={(e) => setFormData({ ...formData, taskNumber: e.target.value })}
          error={errors.taskNumber}
          disabled={isLoading}
          required
          placeholder="ex: PROJ-001"
        />

        <Input
          label="Horas Estimadas"
          type="text"
          inputMode="decimal"
          value={formData.estimatedHours}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              setFormData({ ...formData, estimatedHours: '' });
              return;
            }
            // Allow only digits, one dot or comma as decimal separator
            const cleaned = raw.replace(',', '.');
            if (!/^\d*\.?\d*$/.test(cleaned)) return;
            setFormData({ ...formData, estimatedHours: cleaned });
          }}
          onBlur={(e) => {
            const value = e.target.value.trim().replace(',', '.');
            if (value === '') return;
            const num = parseFloat(value);
            if (!Number.isNaN(num) && num >= 0) {
              setFormData((prev) => ({ ...prev, estimatedHours: num.toFixed(2) }));
            }
          }}
          disabled={isLoading}
          placeholder="ex: 40.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
          placeholder="Descreva a tarefa realizada..."
          rows={4}
          className={`
            block w-full px-3 py-2.5
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
            border ${errors.description ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'}
            rounded-lg shadow-sm
            focus:outline-none focus:ring-2
            transition-all duration-200
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          `}
        />
        {errors.description && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Data de Criação"
          type="date"
          value={formData.creationDate}
          onChange={(e) => setFormData({ ...formData, creationDate: e.target.value })}
          error={errors.creationDate}
          disabled={isLoading}
          required
          max={new Date().toISOString().split('T')[0]}
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' })}
          disabled={isLoading}
          error={errors.status}
          options={[
            { value: 'pending', label: 'Pendente' },
            { value: 'completed', label: 'Concluída' },
          ]}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {task ? 'Atualizar' : 'Criar'} Tarefa
        </Button>
      </div>
    </form>
  );
}
