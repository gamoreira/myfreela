import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { Button, Card, Input, Select, Pagination, AlertDialog } from '../components/common';
import {
  TasksTable,
  CreateTaskModal,
  EditTaskModal,
  DeleteTaskConfirmationModal,
} from '../components/tasks';
import { taskService } from '../services/taskService';
import { clientService } from '../services/clientService';
import { taskTypeService } from '../services/taskTypeService';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import type { Task, TaskFilters } from '../types/task';
import type { Client } from '../types/client';
import type { TaskType } from '../types/taskType';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & totals
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 20,
    status: 'all',
  });

  // Date period filter
  const [datePeriod, setDatePeriod] = useState<string>('');

  // Search input (separate from filters for debounce)
  const [searchInput, setSearchInput] = useState<string>('');

  // Date inputs (separate from filters for debounce)
  const [dateFromInput, setDateFromInput] = useState<string>('');
  const [dateToInput, setDateToInput] = useState<string>('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Alert state
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        setFilters(prev => ({
          ...prev,
          search: searchInput || undefined,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce date inputs (only for interval mode)
  useEffect(() => {
    if (datePeriod !== 'interval') return;

    const timer = setTimeout(() => {
      const needsUpdate =
        dateFromInput !== (filters.dateFrom || '') ||
        dateToInput !== (filters.dateTo || '');

      if (needsUpdate) {
        setFilters(prev => ({
          ...prev,
          dateFrom: dateFromInput || undefined,
          dateTo: dateToInput || undefined,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dateFromInput, dateToInput, datePeriod]);

  const loadInitialData = async () => {
    try {
      const [clientsData, taskTypesData] = await Promise.all([
        clientService.getAll(),
        taskTypeService.getAll(),
      ]);
      setClients(clientsData.filter((c) => c.isActive));
      setTaskTypes(taskTypesData.filter((tt) => tt.isActive));
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getAll(filters);
      setTasks(response.tasks);
      setTotalTasks(response.pagination.total);
      setTotalHours(Number(response.summary.totalHours) || 0);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.response?.data?.error || 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 when changing filters
    });
  };

  const handlePageChange = (page: number) => {
    handleFilterChange('page', page);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: 'all',
    });
    setDatePeriod('');
    setSearchInput('');
    setDateFromInput('');
    setDateToInput('');
  };

  const handleDatePeriodChange = (period: string) => {
    setDatePeriod(period);

    if (period === 'interval') {
      // Clear date inputs for manual entry
      setDateFromInput('');
      setDateToInput('');
      setFilters(prev => ({
        ...prev,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
      }));
      return;
    }

    // Clear date inputs when not using interval
    setDateFromInput('');
    setDateToInput('');

    const now = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    if (period === 'current_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFrom = firstDay.toISOString().split('T')[0];
      dateTo = lastDay.toISOString().split('T')[0];
    } else if (period === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      dateFrom = firstDay.toISOString().split('T')[0];
      dateTo = lastDay.toISOString().split('T')[0];
    } else if (period === 'next_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      dateFrom = firstDay.toISOString().split('T')[0];
      dateTo = lastDay.toISOString().split('T')[0];
    } else {
      // Clear dates
      dateFrom = undefined;
      dateTo = undefined;
    }

    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo,
      page: 1,
    }));
  };

  const handleCreateSuccess = () => {
    loadTasks();
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadTasks();
    setSelectedTask(null);
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    loadTasks();
    setSelectedTask(null);
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      // Validate that task has hours registered before marking as completed
      if (task.status === 'pending' && Number(task.hoursSpent) <= 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Ação não permitida',
          message: 'Não é possível concluir uma tarefa sem horas registradas. Por favor, registre as horas trabalhadas primeiro.',
          type: 'warning',
        });
        return;
      }

      await taskService.toggleStatus(task.id);
      loadTasks();
    } catch (err: any) {
      console.error('Error toggling task status:', err);
      setAlertDialog({
        isOpen: true,
        title: 'Erro',
        message: err.response?.data?.error || 'Erro ao alterar status da tarefa',
        type: 'error',
      });
    }
  };

  const hasActiveFilters =
    filters.clientId ||
    filters.taskTypeId ||
    (filters.status && filters.status !== 'all') ||
    datePeriod ||
    searchInput;

  if (loading && tasks.length === 0) {
    return (
      <Layout>
        <Loading size="lg" text="Carregando tarefas..." />
      </Layout>
    );
  }

  if (error && tasks.length === 0) {
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar tarefas</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadTasks}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tarefas</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Gerencie e acompanhe suas tarefas</p>
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
            Nova Tarefa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Tarefas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalTasks}</p>
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalHours.toFixed(1)}h
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Página Atual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {currentPage}/{totalPages || 1}
                </p>
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar descrição..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                icon={
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />

              <Select
                value={filters.clientId || ''}
                onChange={(e) => handleFilterChange('clientId', e.target.value || undefined)}
                options={[
                  { value: '', label: 'Todos os clientes' },
                  ...clients.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <Select
                value={filters.taskTypeId || ''}
                onChange={(e) => handleFilterChange('taskTypeId', e.target.value || undefined)}
                options={[
                  { value: '', label: 'Todos os tipos' },
                  ...taskTypes.map((tt) => ({ value: tt.id, label: tt.name })),
                ]}
              />

              <Select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value as any)}
                options={[
                  { value: 'all', label: 'Todos os status' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'completed', label: 'Concluídas' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select
                value={datePeriod}
                onChange={(e) => handleDatePeriodChange(e.target.value)}
                options={[
                  { value: '', label: 'Todas as datas' },
                  { value: 'current_month', label: 'Mês atual' },
                  { value: 'last_month', label: 'Último mês' },
                  { value: 'next_month', label: 'Próximo mês' },
                  { value: 'interval', label: 'Intervalo personalizado' },
                ]}
              />

              {datePeriod === 'interval' && (
                <>
                  <Input
                    type="date"
                    placeholder="Data inicial"
                    value={dateFromInput}
                    onChange={(e) => setDateFromInput(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Data final"
                    value={dateToInput}
                    onChange={(e) => setDateToInput(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card padding="none">
          {tasks.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
              title={hasActiveFilters ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
              description={
                hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece criando sua primeira tarefa para rastrear seu tempo e faturamento."
              }
              action={
                hasActiveFilters
                  ? undefined
                  : {
                      label: "Criar Primeira Tarefa",
                      onClick: () => setIsCreateModalOpen(true),
                    }
              }
            />
          ) : (
            <TasksTable
              tasks={tasks}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
              onUpdate={loadTasks}
            />
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalTasks}
            itemsPerPage={filters.limit || 20}
          />
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedTask && (
        <>
          <EditTaskModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedTask(null);
            }}
            onSuccess={handleEditSuccess}
            task={selectedTask}
          />

          <DeleteTaskConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTask(null);
            }}
            onSuccess={handleDeleteSuccess}
            task={selectedTask}
          />
        </>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </Layout>
  );
}
