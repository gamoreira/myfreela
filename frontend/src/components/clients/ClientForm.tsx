import { useState, FormEvent } from 'react';
import { Button, Input, Toggle } from '../common';
import type { Client, CreateClientDto, UpdateClientDto } from '../../types/client';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientDto | UpdateClientDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    isActive: client?.isActive !== undefined ? client.isActive : true,
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do cliente é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateClientDto | UpdateClientDto = {
      name: formData.name.trim(),
      isActive: formData.isActive,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do Cliente"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="Ex: Empresa XYZ"
        disabled={isLoading}
        fullWidth
        required
      />

      <div className="pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
        <Toggle
          label="Status do Cliente"
          description={formData.isActive ? "Cliente ativo e disponível para novas tarefas" : "Cliente inativo - não aparecerá nas listagens ativas"}
          checked={formData.isActive}
          onChange={(checked) => setFormData({ ...formData, isActive: checked })}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {client ? 'Atualizar' : 'Criar'} Cliente
        </Button>
      </div>
    </form>
  );
}
