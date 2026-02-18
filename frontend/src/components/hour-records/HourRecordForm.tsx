import { useState, FormEvent, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import type { HourRecord, CreateHourRecordDto, UpdateHourRecordDto } from '../../types/hourRecord';
import type { Task } from '../../types/task';
import { taskService } from '../../services/taskService';
import { settingsService } from '../../services/settingsService';

interface HourRecordFormProps {
  hourRecord?: HourRecord;
  onSubmit: (data: CreateHourRecordDto | UpdateHourRecordDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedTaskId?: string;
}

export default function HourRecordForm({
  hourRecord,
  onSubmit,
  onCancel,
  isLoading = false,
  preselectedTaskId,
}: HourRecordFormProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [allowFutureDates, setAllowFutureDates] = useState(false);

  // Helper function to get date in YYYY-MM-DD format without timezone issues
  const getLocalDateString = (dateString?: string) => {
    if (dateString) {
      // If date comes as ISO string (e.g., "2024-01-15T00:00:00.000Z"), extract just the date part
      // This avoids timezone conversion issues
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      // If it's already YYYY-MM-DD, return as is
      return dateString;
    }
    // For new records, get today's date in local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    taskId: hourRecord?.taskId || preselectedTaskId || '',
    workDate: getLocalDateString(hourRecord?.workDate),
    hoursWorked: hourRecord?.hoursWorked?.toString() || '',
    description: hourRecord?.description || '',
  });

  const [errors, setErrors] = useState<{
    taskId?: string;
    workDate?: string;
    hoursWorked?: string;
    description?: string;
  }>({});

  // Update form data when hourRecord changes (e.g., when editing a different record)
  useEffect(() => {
    setFormData({
      taskId: hourRecord?.taskId || preselectedTaskId || '',
      workDate: getLocalDateString(hourRecord?.workDate),
      hoursWorked: hourRecord?.hoursWorked?.toString() || '',
      description: hourRecord?.description || '',
    });
    setErrors({});
  }, [hourRecord, preselectedTaskId]);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [tasksResponse, userSettings] = await Promise.all([
        taskService.getAll({ limit: 1000 }),
        settingsService.getUserSettings(),
      ]);
      // Filter only tasks with taskNumber (project tasks)
      const projectTasks = tasksResponse.tasks.filter(t => t.taskNumber && t.estimatedHours);
      setTasks(projectTasks);
      setAllowFutureDates(userSettings.allowFutureDateHourRecords);
    } catch (err) {
      console.error('Error loading form data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.taskId) {
      newErrors.taskId = 'Tarefa é obrigatória';
    }

    if (!formData.workDate) {
      newErrors.workDate = 'Data é obrigatória';
    } else {
      const workDate = new Date(formData.workDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      workDate.setHours(0, 0, 0, 0);

      // Conditional date validation based on user settings
      if (!allowFutureDates && workDate > today) {
        newErrors.workDate =
          'Data não pode ser futura. Habilite datas futuras nas configurações se necessário.';
      }
    }

    if (!formData.hoursWorked) {
      newErrors.hoursWorked = 'Horas trabalhadas é obrigatório';
    } else {
      const hours = parseFloat(formData.hoursWorked.replace(',', '.'));
      if (isNaN(hours) || hours <= 0) {
        newErrors.hoursWorked = 'Horas trabalhadas deve ser um número positivo';
      } else if (hours > 24) {
        newErrors.hoursWorked = 'Horas trabalhadas não pode exceder 24 horas';
      } else if (hours > 9999.99) {
        newErrors.hoursWorked = 'Horas trabalhadas deve ser no máximo 9999.99';
      }
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Descrição deve ter no máximo 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: any = {
      workDate: formData.workDate,
      hoursWorked: parseFloat(formData.hoursWorked.replace(',', '.')),
      description: formData.description.trim() || undefined,
    };

    // Only include taskId when creating
    if (!hourRecord) {
      data.taskId = formData.taskId;
    }

    await onSubmit(data);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!hourRecord && !preselectedTaskId && (
        <div>
          <label htmlFor="taskId" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Tarefa <span className="text-red-500">*</span>
          </label>
          <Select
            id="taskId"
            value={formData.taskId}
            onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
            error={errors.taskId}
            disabled={isLoading}
          >
            <option value="">Selecione uma tarefa</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.taskNumber} - {task.name}
              </option>
            ))}
          </Select>
          {errors.taskId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taskId}</p>}
        </div>
      )}

      <div>
        <label htmlFor="workDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Data de Trabalho <span className="text-red-500">*</span>
        </label>
        <Input
          id="workDate"
          type="date"
          value={formData.workDate}
          onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
          error={errors.workDate}
          disabled={isLoading}
        />
        {errors.workDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.workDate}</p>}
        {!allowFutureDates && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Datas futuras estão bloqueadas. Para habilitar, acesse as{' '}
            <a href="/settings" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 underline">
              Configurações
            </a>
            .
          </p>
        )}
      </div>

      <div>
        <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Horas Trabalhadas <span className="text-red-500">*</span>
        </label>
        <Input
          id="hoursWorked"
          type="text"
          inputMode="decimal"
          value={formData.hoursWorked}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              setFormData({ ...formData, hoursWorked: '' });
              return;
            }
            // Allow only digits, one dot or comma as decimal separator
            const cleaned = raw.replace(',', '.');
            if (!/^\d*\.?\d*$/.test(cleaned)) return;
            setFormData({ ...formData, hoursWorked: cleaned });
          }}
          onBlur={(e) => {
            const value = e.target.value.trim().replace(',', '.');
            if (value === '') return;
            const num = parseFloat(value);
            if (!Number.isNaN(num) && num >= 0) {
              setFormData((prev) => ({ ...prev, hoursWorked: num.toFixed(2) }));
            }
          }}
          placeholder="Ex: 8.50"
          error={errors.hoursWorked}
          disabled={isLoading}
        />
        {errors.hoursWorked && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hoursWorked}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva as atividades realizadas..."
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
          disabled={isLoading}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {hourRecord ? 'Atualizar Registro' : 'Registrar Horas'}
        </Button>
      </div>
    </form>
  );
}
