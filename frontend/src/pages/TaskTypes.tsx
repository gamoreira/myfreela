import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { Button, Card } from '../components/common';
import {
  TaskTypesTable,
  CreateTaskTypeModal,
  EditTaskTypeModal,
  DeleteTaskTypeConfirmationModal,
} from '../components/taskTypes';
import { taskTypeService } from '../services/taskTypeService';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import type { TaskType } from '../types/taskType';

export default function TaskTypes() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);

  useEffect(() => {
    loadTaskTypes();
  }, []);

  const loadTaskTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskTypeService.getAll();
      setTaskTypes(data);
    } catch (err: any) {
      console.error('Error loading task types:', err);
      setError(err.response?.data?.error || 'Erro ao carregar tipos de tarefa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newTaskType: TaskType) => {
    setTaskTypes([...taskTypes, newTaskType]);
  };

  const handleEditClick = (taskType: TaskType) => {
    setSelectedTaskType(taskType);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedTaskType: TaskType) => {
    setTaskTypes(taskTypes.map((tt) => (tt.id === updatedTaskType.id ? updatedTaskType : tt)));
    setSelectedTaskType(null);
  };

  const handleDeleteClick = (taskType: TaskType) => {
    setSelectedTaskType(taskType);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    loadTaskTypes(); // Reload to get updated state (might be soft or hard delete)
    setSelectedTaskType(null);
  };

  const activeTaskTypes = taskTypes.filter((tt) => tt.isActive);
  const inactiveTaskTypes = taskTypes.filter((tt) => !tt.isActive);

  if (loading) {
    return (
      <Layout>
        <Loading size="lg" text="Carregando tipos de tarefa..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Erro ao carregar tipos de tarefa
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadTaskTypes}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipos de Tarefa</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Gerencie os tipos de tarefas do sistema</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Novo Tipo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Tipos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{taskTypes.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipos Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{activeTaskTypes.length}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipos Inativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{inactiveTaskTypes.length}</p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Task Types Table */}
        <Card padding="none">
          {taskTypes.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              }
              title="Nenhum tipo de tarefa cadastrado"
              description="Crie tipos de tarefa para categorizar e precificar seu trabalho de forma organizada."
              action={{
                label: "Criar Primeiro Tipo",
                onClick: () => setIsCreateModalOpen(true),
              }}
            />
          ) : (
            <TaskTypesTable
              taskTypes={taskTypes}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateTaskTypeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedTaskType && (
        <>
          <EditTaskTypeModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedTaskType(null);
            }}
            onSuccess={handleEditSuccess}
            taskType={selectedTaskType}
          />

          <DeleteTaskTypeConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTaskType(null);
            }}
            onSuccess={handleDeleteSuccess}
            taskType={selectedTaskType}
          />
        </>
      )}
    </Layout>
  );
}
