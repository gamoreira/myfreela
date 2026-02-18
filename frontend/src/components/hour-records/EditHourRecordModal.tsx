import { useState } from 'react';
import { Modal } from '../common';
import HourRecordForm from './HourRecordForm';
import { hourRecordService } from '../../services/hourRecordService';
import type { CreateHourRecordDto, UpdateHourRecordDto, HourRecord } from '../../types/hourRecord';

interface EditHourRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hourRecord: HourRecord) => void;
  hourRecord: HourRecord;
}

export default function EditHourRecordModal({
  isOpen,
  onClose,
  onSuccess,
  hourRecord,
}: EditHourRecordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateHourRecordDto | UpdateHourRecordDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedHourRecord = await hourRecordService.update(hourRecord.id, data as UpdateHourRecordDto);
      onSuccess(updatedHourRecord);
      onClose();
    } catch (err: any) {
      console.error('Error updating hour record:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar registro');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Registro de Horas" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <HourRecordForm
        hourRecord={hourRecord}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
