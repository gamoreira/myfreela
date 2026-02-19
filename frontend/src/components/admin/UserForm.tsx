import { useState, FormEvent } from 'react';
import { Button, Input, Toggle } from '../common';
import type { AdminUser } from '../../types/admin';

interface UserFormData {
  name: string;
  email: string;
  isAdmin: boolean;
  password: string;
}

interface UserFormErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface UserFormProps {
  user: AdminUser;
  onSubmit: (data: Partial<UserFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    password: '',
  });

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<UserFormData> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      isAdmin: formData.isAdmin,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <Input
        label="Nome"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="Nome do usuário"
        disabled={isLoading}
        fullWidth
        required
      />

      <Input
        label="E-mail"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="email@exemplo.com"
        disabled={isLoading}
        autoComplete="off"
        fullWidth
        required
      />

      <div className="pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
        <Toggle
          label="Administrador"
          description={
            formData.isAdmin
              ? 'Usuário tem acesso total ao painel de administração'
              : 'Usuário regular sem acesso ao painel de administração'
          }
          checked={formData.isAdmin}
          onChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
          disabled={isLoading}
        />
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Nova Senha
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            placeholder="Deixe em branco para não alterar"
            disabled={isLoading}
            autoComplete="new-password"
            fullWidth
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          A senha atual não é exibida. Preencha apenas se quiser alterá-la.
        </p>
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
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
