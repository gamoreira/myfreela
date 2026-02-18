import { useState } from 'react';
import { Modal } from '../common';
import HourRecordForm from './HourRecordForm';
import { hourRecordService } from '../../services/hourRecordService';
import type { CreateHourRecordDto, UpdateHourRecordDto, HourRecord } from '../../types/hourRecord';

interface CreateHourRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hourRecord: HourRecord) => void;
  preselectedTaskId?: string;
}

export default function CreateHourRecordModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedTaskId,
}: CreateHourRecordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateHourRecordDto | UpdateHourRecordDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const newHourRecord = await hourRecordService.create(data as CreateHourRecordDto);
      onSuccess(newHourRecord);
      onClose();
    } catch (err: any) {
      console.error('Error creating hour record:', err);
      setError(err.response?.data?.error || 'Erro ao registrar horas');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Horas" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <HourRecordForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
        preselectedTaskId={preselectedTaskId}
      />
    </Modal>
  );
}
