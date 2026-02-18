import { useState, FormEvent } from 'react';
import { Button, Input, ColorPicker, Toggle } from '../common';
import type { TaskType, CreateTaskTypeDto, UpdateTaskTypeDto } from '../../types/taskType';

interface TaskTypeFormProps {
  taskType?: TaskType;
  onSubmit: (data: CreateTaskTypeDto | UpdateTaskTypeDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskTypeForm({
  taskType,
  onSubmit,
  onCancel,
  isLoading = false,
}: TaskTypeFormProps) {
  const [formData, setFormData] = useState({
    name: taskType?.name || '',
    color: taskType?.color || '#3B82F6',
    isActive: taskType?.isActive !== undefined ? taskType.isActive : true,
  });

  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; color?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do tipo de tarefa é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    if (!formData.color) {
      newErrors.color = 'Cor é obrigatória';
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Cor deve ser um código hexadecimal válido (ex: #FF5733)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateTaskTypeDto | UpdateTaskTypeDto = {
      name: formData.name.trim(),
      color: formData.color.toUpperCase(),
      isActive: formData.isActive,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do Tipo de Tarefa"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="Ex: Desenvolvimento, Design, Reunião"
        disabled={isLoading}
        fullWidth
        required
      />

      <ColorPicker
        label="Cor"
        value={formData.color}
        onChange={(color) => setFormData({ ...formData, color })}
        error={errors.color}
        disabled={isLoading}
        required
      />

      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div
          className="w-10 h-10 rounded-lg flex-shrink-0"
          style={{ backgroundColor: formData.color }}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Prévia</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {formData.name || 'Nome do tipo de tarefa'}
          </p>
        </div>
      </div>

      <div className="pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
        <Toggle
          label="Status do Tipo de Tarefa"
          description={formData.isActive ? "Tipo ativo e disponível para uso em tarefas" : "Tipo inativo - não aparecerá nas listagens ativas"}
          checked={formData.isActive}
          onChange={(checked) => setFormData({ ...formData, isActive: checked })}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {taskType ? 'Atualizar' : 'Criar'} Tipo
        </Button>
      </div>
    </form>
  );
}
