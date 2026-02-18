import { useState, useEffect } from 'react';
import { Modal, Button } from '../common';
import {
  HourRecordsTable,
  CreateHourRecordModal,
  EditHourRecordModal,
  DeleteHourRecordConfirmationModal,
} from '../hour-records';
import { hourRecordService } from '../../services/hourRecordService';
import type { Task } from '../../types/task';
import type { HourRecord } from '../../types/hourRecord';

interface TaskHourRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate?: () => void;
}

export default function TaskHourRecordsModal({
  isOpen,
  onClose,
  task,
  onUpdate,
}: TaskHourRecordsModalProps) {
  const [hourRecords, setHourRecords] = useState<HourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHourRecord, setEditingHourRecord] = useState<HourRecord | null>(null);
  const [deletingHourRecord, setDeletingHourRecord] = useState<HourRecord | null>(null);

  useEffect(() => {
    if (isOpen && task.id) {
      loadHourRecords();
    }
  }, [isOpen, task.id]);

  const loadHourRecords = async () => {
    try {
      setLoading(true);
      const records = await hourRecordService.getByTask(task.id);
      setHourRecords(records);
    } catch (err) {
      console.error('Error loading hour records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newRecord: HourRecord) => {
    setHourRecords([...hourRecords, newRecord]);
    onUpdate?.();
  };

  const handleEditSuccess = (updatedRecord: HourRecord) => {
    setHourRecords(
      hourRecords.map((record) => (record.id === updatedRecord.id ? updatedRecord : record))
    );
    onUpdate?.();
  };

  const handleDeleteSuccess = () => {
    if (deletingHourRecord) {
      setHourRecords(hourRecords.filter((record) => record.id !== deletingHourRecord.id));
      setDeletingHourRecord(null);
      onUpdate?.();
    }
  };

  // Calculate statistics
  const totalHoursSpent = hourRecords.reduce((sum, record) => sum + Number(record.hoursWorked), 0);
  const estimatedHours = task.estimatedHours ? Number(task.estimatedHours) : null;
  const isProjectTask = estimatedHours !== null;
  const remainingHours = isProjectTask ? estimatedHours - totalHoursSpent : null;
  const progressPercentage = isProjectTask && estimatedHours > 0
    ? (totalHoursSpent / estimatedHours) * 100
    : 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Registros de Horas - ${task.taskNumber || task.name}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Statistics Summary */}
          {isProjectTask ? (
            // Project task with estimates - show full statistics
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Horas Estimadas</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {estimatedHours.toFixed(2)}h
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Horas Gastas</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {totalHoursSpent.toFixed(2)}h
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${remainingHours! >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${remainingHours! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {remainingHours! >= 0 ? 'Horas Restantes' : 'Horas Excedidas'}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${remainingHours! >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {Math.abs(remainingHours!).toFixed(2)}h
                      </p>
                    </div>
                    <svg className={`w-8 h-8 ${remainingHours! >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Progresso</p>
                      <p className="text-2xl font-bold text-indigo-900 mt-1">
                        {progressPercentage.toFixed(0)}%
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Progresso do Projeto</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {totalHoursSpent.toFixed(2)}h / {estimatedHours.toFixed(2)}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progressPercentage >= 100
                        ? 'bg-red-600'
                        : progressPercentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            // Ongoing task without estimates - show simplified statistics
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total de Horas</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {totalHoursSpent.toFixed(2)}h
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total de Registros</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {hourRecords.length}
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Hour Records Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Registros</h4>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Registrar Horas
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <HourRecordsTable
                hourRecords={hourRecords}
                onEdit={setEditingHourRecord}
                onDelete={setDeletingHourRecord}
                showTaskInfo={false}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <CreateHourRecordModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        preselectedTaskId={task.id}
      />

      {editingHourRecord && (
        <EditHourRecordModal
          isOpen={true}
          onClose={() => setEditingHourRecord(null)}
          onSuccess={handleEditSuccess}
          hourRecord={editingHourRecord}
        />
      )}

      {deletingHourRecord && (
        <DeleteHourRecordConfirmationModal
          isOpen={true}
          onClose={() => setDeletingHourRecord(null)}
          onSuccess={handleDeleteSuccess}
          hourRecord={deletingHourRecord}
        />
      )}
    </>
  );
}
