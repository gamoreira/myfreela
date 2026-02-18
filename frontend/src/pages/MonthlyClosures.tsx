import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { Button, Card, Select, ConfirmDialog, AlertDialog } from '../components/common';
import {
  MonthlyClosuresTable,
  CreateMonthlyClosureModal,
  EditMonthlyClosureModal,
  ViewDetailsModal,
  DeleteMonthlyClosureModal,
} from '../components/monthly-closures';
import { monthlyClosureService } from '../services/monthlyClosureService';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import type { MonthlyClosure } from '../types/monthlyClosure';

export default function MonthlyClosures() {
  const [closures, setClosures] = useState<MonthlyClosure[]>([]);
  const [filteredClosures, setFilteredClosures] = useState<MonthlyClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<MonthlyClosure | null>(null);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info',
  });

  // Alert dialog states
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const [isToggleLoading, setIsToggleLoading] = useState(false);

  useEffect(() => {
    loadClosures();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [closures, selectedYear, selectedStatus]);

  const loadClosures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await monthlyClosureService.getAll();
      setClosures(data);
    } catch (err: any) {
      console.error('Error loading monthly closures:', err);
      setError(err.response?.data?.error || 'Erro ao carregar os faturamentos!');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...closures];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter((c) => c.year === Number(selectedYear));
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    setFilteredClosures(filtered);
  };

  const handleCreateSuccess = () => {
    loadClosures();
  };

  const handleViewClick = (closure: MonthlyClosure) => {
    setSelectedClosure(closure);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (closure: MonthlyClosure) => {
    setSelectedClosure(closure);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedClosure: MonthlyClosure) => {
    loadClosures();
    setSelectedClosure(updatedClosure);
  };

  const handleToggleStatus = async (closure: MonthlyClosure) => {
    // Check for issues preventing closure
    if (closure.status === 'open' && (closure.hasPendingTasks || closure.hasTasksWithoutHours)) {
      const issues = [];
      if (closure.hasPendingTasks) {
        issues.push(`${closure.pendingTasksCount} tarefa(s) com status pendente`);
      }
      if (closure.hasTasksWithoutHours) {
        issues.push(`${closure.tasksWithoutHoursCount} tarefa(s) sem horas registradas`);
      }

      setAlertDialog({
        isOpen: true,
        title: 'Não é possível fechar o faturamento',
        message: (
          <div className="text-left space-y-3">
            <p>Para fechar este faturamento, você precisa resolver os seguintes problemas:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              {issues.map((issue, index) => (
                <li key={index} className="text-red-600 dark:text-red-400 font-medium">{issue}</li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              Todas as tarefas do período devem estar concluídas e com horas registradas antes de fechar o faturamento.
            </p>
          </div>
        ),
        variant: 'danger',
      });
      return;
    }

    if (closure.status === 'open') {
      // Show confirm dialog to close
      setConfirmDialog({
        isOpen: true,
        title: 'Fechar Faturamento',
        message: (
          <div className="space-y-2">
            <p>
              Deseja realmente fechar o faturamento de <strong>{closure.month}/{closure.year}</strong>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Após fechar, não será mais possível editar este faturamento.
            </p>
          </div>
        ),
        variant: 'warning',
        onConfirm: () => performToggle(closure),
      });
    } else {
      // Show confirm dialog to reopen
      setConfirmDialog({
        isOpen: true,
        title: 'Reabrir Faturamento',
        message: (
          <div className="space-y-2">
            <p>
              Deseja realmente reabrir o faturamento de <strong>{closure.month}/{closure.year}</strong>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Após reabrir, você poderá editar o faturamento novamente.
            </p>
          </div>
        ),
        variant: 'info',
        onConfirm: () => performToggle(closure),
      });
    }
  };

  const performToggle = async (closure: MonthlyClosure) => {
    try {
      setIsToggleLoading(true);

      if (closure.status === 'open') {
        await monthlyClosureService.close(closure.id);
      } else {
        await monthlyClosureService.reopen(closure.id);
      }

      await loadClosures();
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    } catch (err: any) {
      console.error('Error toggling closure status:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao alterar status do faturamento';

      setAlertDialog({
        isOpen: true,
        title: 'Erro ao alterar status',
        message: errorMessage,
        variant: 'danger',
      });
    } finally {
      setIsToggleLoading(false);
    }
  };

  const handleDeleteClick = (closure: MonthlyClosure) => {
    setSelectedClosure(closure);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    loadClosures();
    setSelectedClosure(null);
  };

  const handleGeneratePDF = (closure: MonthlyClosure) => {
    // TODO: Implement PDF generation
    alert(`Geração de PDF para ${closure.month}/${closure.year} será implementada em breve`);
  };

  // Get unique years from closures
  const availableYears = Array.from(new Set(closures.map((c) => c.year))).sort((a, b) => b - a);

  // Calculate statistics
  const stats = filteredClosures.reduce(
    (acc, closure) => {
      const clientTotals = closure.clients.reduce(
        (clientAcc, client) => ({
          totalHours: clientAcc.totalHours + Number(client.totalHours),
          grossAmount: clientAcc.grossAmount + Number(client.grossAmount),
          taxAmount: clientAcc.taxAmount + Number(client.taxAmount),
          netAmount: clientAcc.netAmount + Number(client.netAmount),
        }),
        { totalHours: 0, grossAmount: 0, taxAmount: 0, netAmount: 0 }
      );

      const totalExpenses = closure.totalExpenses || 0;
      const finalAmount = clientTotals.netAmount - totalExpenses;

      return {
        totalClosures: acc.totalClosures + 1,
        totalHours: acc.totalHours + clientTotals.totalHours,
        totalGrossAmount: acc.totalGrossAmount + clientTotals.grossAmount,
        totalTaxAmount: acc.totalTaxAmount + clientTotals.taxAmount,
        totalNetAmount: acc.totalNetAmount + clientTotals.netAmount,
        totalExpenses: acc.totalExpenses + totalExpenses,
        totalFinalAmount: acc.totalFinalAmount + finalAmount,
      };
    },
    {
      totalClosures: 0,
      totalHours: 0,
      totalGrossAmount: 0,
      totalTaxAmount: 0,
      totalNetAmount: 0,
      totalExpenses: 0,
      totalFinalAmount: 0,
    }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const hasActiveFilters = selectedYear !== 'all' || selectedStatus !== 'all';

  const clearFilters = () => {
    setSelectedYear('all');
    setSelectedStatus('all');
  };

  if (loading && closures.length === 0) {
    return (
      <Layout>
        <Loading size="lg" text="Carregando faturamentos..." />
      </Layout>
    );
  }

  if (error && closures.length === 0) {
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
            Erro ao carregar faturamentos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={loadClosures}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faturamento Mensal</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Gerencie seus faturamentos</p>
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
            Novo Faturamento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Faturamento</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalClosures}</p>
              </div>
              <div className="bg-blue-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Total Horas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <div className="bg-purple-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Valor Bruto</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalGrossAmount)}</p>
              </div>
              <div className="bg-green-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Valor Liquido</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalNetAmount)}</p>
              </div>
              <div className="bg-teal-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Despesas</p>
                <p className="text-lg font-bold text-orange-600 mt-1">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div className="bg-orange-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Valor Final</p>
                <p className={`text-lg font-bold mt-1 ${stats.totalFinalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalFinalAmount)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stats.totalFinalAmount >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos os anos' },
                  ...availableYears.map((year) => ({ value: String(year), label: String(year) })),
                ]}
              />

              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos os status' },
                  { value: 'open', label: 'Abertos' },
                  { value: 'closed', label: 'Fechados' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Closures Table */}
        <Card padding="none">
          {filteredClosures.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              title={selectedYear === 'all' ? "Nenhum faturamento cadastrado" : `Nenhum faturamento em ${selectedYear}`}
              description={
                selectedYear === 'all'
                  ? "Crie seu primeiro faturamento para consolidar suas tarefas e faturamento."
                  : `Selecione "Todos" ou outro ano para ver mais faturamentos.`
              }
              action={
                selectedYear === 'all'
                  ? {
                      label: "Criar Primeiro Faturamento",
                      onClick: () => setIsCreateModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <MonthlyClosuresTable
              closures={filteredClosures}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteClick}
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateMonthlyClosureModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedClosure && (
        <>
          <EditMonthlyClosureModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedClosure(null);
            }}
            onSuccess={handleEditSuccess}
            closure={selectedClosure}
          />

          <ViewDetailsModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedClosure(null);
            }}
            closure={selectedClosure}
            onGeneratePDF={handleGeneratePDF}
          />

          <DeleteMonthlyClosureModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedClosure(null);
            }}
            onSuccess={handleDeleteSuccess}
            closure={selectedClosure}
          />
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === 'warning' ? 'Fechar' : 'Confirmar'}
        isLoading={isToggleLoading}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.variant === 'danger' ? 'error' : alertDialog.variant}
      />
    </Layout>
  );
}
