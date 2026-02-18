import { useState } from 'react';
import { Modal } from '../common';
import ClientForm from './ClientForm';
import { clientService } from '../../services/clientService';
import type { CreateClientDto, UpdateClientDto, Client } from '../../types/client';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export default function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateClientDto | UpdateClientDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newClient = await clientService.create(data as CreateClientDto);
      onSuccess(newClient);
      onClose();
    } catch (err: any) {
      console.error('Error creating client:', err);
      setError(err.response?.data?.error || 'Erro ao criar cliente');
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
      title="Novo Cliente"
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <ClientForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
