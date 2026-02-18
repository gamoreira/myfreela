import { useState } from 'react';
import { Modal, Button } from '../common';
import { clientService } from '../../services/clientService';
import type { Client } from '../../types/client';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: Client;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: DeleteConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await clientService.delete(client.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.response?.data?.error || 'Erro ao excluir cliente');
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
      title="Confirmar Exclusão"
      size="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Tem certeza que deseja excluir este cliente?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              O cliente <span className="font-semibold">{client.name}</span> será{' '}
              <span className="text-red-600 dark:text-red-400 font-semibold">excluído permanentemente</span>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta ação não pode ser desfeita. Clientes com tarefas ou faturamentos vinculados não podem ser excluídos.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isLoading}
          >
            Excluir Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
