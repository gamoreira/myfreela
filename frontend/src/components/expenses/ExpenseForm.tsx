import { useState, FormEvent } from 'react';
import { Button, Input, Toggle } from '../common';
import type { Expense, CreateExpenseDto, UpdateExpenseDto } from '../../types/expense';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: CreateExpenseDto | UpdateExpenseDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ExpenseForm({ expense, onSubmit, onCancel, isLoading = false }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    description: expense?.description || '',
    amount: expense?.amount ? Number(expense.amount).toFixed(2) : '',
    isRecurring: expense?.isRecurring !== undefined ? expense.isRecurring : true,
    isActive: expense?.isActive !== undefined ? expense.isActive : true,
  });

  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; amount?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da despesa e obrigatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no maximo 100 caracteres';
    }

    if (!formData.amount) {
      newErrors.amount = 'Valor e obrigatorio';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Valor deve ser um numero positivo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountBlur = () => {
    if (formData.amount) {
      const value = parseFloat(formData.amount);
      if (!isNaN(value)) {
        setFormData({ ...formData, amount: value.toFixed(2) });
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateExpenseDto | UpdateExpenseDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      amount: parseFloat(formData.amount),
      isRecurring: formData.isRecurring,
      ...(expense && { isActive: formData.isActive }),
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da Despesa"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="Ex: Contador, Escritorio, Internet"
        disabled={isLoading}
        fullWidth
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Descricao (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descricao adicional da despesa..."
          disabled={isLoading}
          rows={3}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        min="0.01"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        onBlur={handleAmountBlur}
        error={errors.amount}
        placeholder="Ex: 500.00"
        disabled={isLoading}
        fullWidth
        required
        icon={<span className="text-gray-500 font-medium">R$</span>}
      />

      <div className="pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
        <Toggle
          label="Despesa Recorrente"
          description={
            formData.isRecurring
              ? 'Esta despesa se repete mensalmente'
              : 'Esta e uma despesa avulsa (unica)'
          }
          checked={formData.isRecurring}
          onChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
          disabled={isLoading}
        />
      </div>

      {expense && (
        <div className="pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
          <Toggle
            label="Status da Despesa"
            description={
              formData.isActive
                ? 'Despesa ativa e disponivel para faturamentos'
                : 'Despesa inativa - nao aparecera nas listagens'
            }
            checked={formData.isActive}
            onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {expense ? 'Atualizar' : 'Criar'} Despesa
        </Button>
      </div>
    </form>
  );
}
