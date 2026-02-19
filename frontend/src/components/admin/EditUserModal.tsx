import { useState } from 'react';
import { Modal } from '../common';
import UserForm from './UserForm';
import { adminService } from '../../services/adminService';
import type { AdminUser } from '../../types/admin';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
  user: AdminUser;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Parameters<typeof adminService.updateUser>[1]) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await adminService.updateUser(user.id, data);
      onSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar usuário');
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuário"
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <UserForm
        user={user}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
