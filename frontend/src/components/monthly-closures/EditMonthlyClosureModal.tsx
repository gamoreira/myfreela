import { useState, useEffect } from 'react';
import { Modal, Button } from '../common';
import MonthlyClosureForm from './MonthlyClosureForm';
import Loading from '../Loading';
import { monthlyClosureService } from '../../services/monthlyClosureService';
import { expenseService } from '../../services/expenseService';
import type { UpdateMonthlyClosureDto, MonthlyClosure } from '../../types/monthlyClosure';
import type { Expense } from '../../types/expense';

interface EditMonthlyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (closure: MonthlyClosure) => void;
  closure: MonthlyClosure;
}

export default function EditMonthlyClosureModal({
  isOpen,
  onClose,
  onSuccess,
  closure,
}: EditMonthlyClosureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingClosure, setLoadingClosure] = useState(false);

  // Expense management state
  const [closureData, setClosureData] = useState<MonthlyClosure>(closure);
  const [availableExpenses, setAvailableExpenses] = useState<Expense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [editingAmounts, setEditingAmounts] = useState<Record<string, number>>({});
  const [editingAmountDisplays, setEditingAmountDisplays] = useState<Record<string, string>>({});
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedNewExpenseId, setSelectedNewExpenseId] = useState('');

  // Load full closure by ID when modal opens (ensures hourlyRate and full data)
  useEffect(() => {
    if (!isOpen || !closure?.id) return;
    let cancelled = false;
    setLoadError(null);
    setLoadingClosure(true);
    monthlyClosureService
      .getById(closure.id)
      .then((full) => {
        if (!cancelled) {
          setClosureData(full);
          const amounts: Record<string, number> = {};
          const displays: Record<string, string> = {};
          full.expenses?.forEach(exp => {
            amounts[exp.id] = Number(exp.amount);
            displays[exp.id] = Number(exp.amount).toFixed(2).replace('.', ',');
          });
          setEditingAmounts(amounts);
          setEditingAmountDisplays(displays);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setLoadError(err.response?.data?.error || 'Erro ao carregar dados do faturamento');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingClosure(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, closure?.id]);

  // Sync closure prop when modal is closed (e.g. parent passes new closure next time)
  useEffect(() => {
    if (!isOpen) setClosureData(closure);
  }, [isOpen, closure]);

  // Load available expenses when modal opens
  useEffect(() => {
    if (isOpen && closureData.status === 'open') {
      loadAvailableExpenses();
    }
  }, [isOpen, closureData.status]);

  const loadAvailableExpenses = async () => {
    try {
      const expenses = await expenseService.getAll(false);
      setAvailableExpenses(expenses);
    } catch (err) {
      console.error('Error loading expenses:', err);
    }
  };

  const refreshClosure = async () => {
    try {
      const fresh = await monthlyClosureService.getById(closureData.id);
      setClosureData(fresh);
      onSuccess(fresh);
      // Update editing amounts
      const amounts: Record<string, number> = {};
      const displays: Record<string, string> = {};
      fresh.expenses?.forEach(exp => {
        amounts[exp.id] = Number(exp.amount);
        displays[exp.id] = Number(exp.amount).toFixed(2).replace('.', ',');
      });
      setEditingAmounts(amounts);
      setEditingAmountDisplays(displays);
    } catch (err) {
      console.error('Error refreshing closure:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDecimalInput = (rawValue: string): { display: string; numeric: number } => {
    const digits = rawValue.replace(/\D/g, '');
    const numeric = parseInt(digits || '0', 10) / 100;
    const display = numeric.toFixed(2).replace('.', ',');
    return { display, numeric };
  };

  const handleSubmit = async (data: UpdateMonthlyClosureDto) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedClosure = await monthlyClosureService.update(closureData.id, data);
      onSuccess(updatedClosure);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar o faturamento:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar o faturamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExpenseAmount = async (expenseId: string) => {
    const newAmount = editingAmounts[expenseId];
    if (newAmount === undefined || newAmount < 0) return;

    try {
      setExpenseLoading(true);
      setError(null);
      await monthlyClosureService.updateExpense(closureData.id, expenseId, { amount: newAmount });
      await refreshClosure();
    } catch (err: any) {
      console.error('Error updating expense:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar despesa');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    try {
      setExpenseLoading(true);
      setError(null);
      await monthlyClosureService.removeExpense(closureData.id, expenseId);
      await refreshClosure();
    } catch (err: any) {
      console.error('Erro ao remover despesa:', err);
      setError(err.response?.data?.error || 'Erro ao remover despesa');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!selectedNewExpenseId) return;

    const expense = availableExpenses.find(e => e.id === selectedNewExpenseId);
    if (!expense) return;

    try {
      setExpenseLoading(true);
      setError(null);
      await monthlyClosureService.addExpense(closureData.id, {
        expenseId: expense.id,
        amount: Number(expense.amount),
      });
      await refreshClosure();
      setSelectedNewExpenseId('');
      setShowAddExpense(false);
    } catch (err: any) {
      console.error('Erro ao adicionar despesa:', err);
      setError(err.response?.data?.error || 'Erro ao adicionar despesa');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !expenseLoading) {
      setError(null);
      setLoadError(null);
      setShowAddExpense(false);
      setSelectedNewExpenseId('');
      onClose();
    }
  };

  // Expenses already in the closure (by expenseId)
  const existingExpenseIds = new Set(
    closureData.expenses?.map(e => e.expenseId).filter(Boolean) || []
  );
  // Available expenses not yet added
  const addableExpenses = availableExpenses.filter(e => !existingExpenseIds.has(e.id));

  const expensesTotal = closureData.expenses?.reduce((acc, e) => acc + Number(e.amount), 0) ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Faturamento" size="lg">
      {loadingClosure ? (
        <div className="py-12">
          <Loading size="lg" text="Carregando dados do faturamento..." />
        </div>
      ) : loadError ? (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        </div>
      ) : (
        <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {(closureData.hasPendingTasks || closureData.hasTasksWithoutHours) && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">{"Problemas no Per\u00edodo"}</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                Para fechar este faturamento, resolva os seguintes problemas:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                {closureData.hasPendingTasks && (
                  <li>
                    <strong>{closureData.pendingTasksCount} tarefa(s)</strong> com status pendente
                  </li>
                )}
                {closureData.hasTasksWithoutHours && (
                  <li>
                    <strong>{closureData.tasksWithoutHoursCount} tarefa(s)</strong> sem horas registradas
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <MonthlyClosureForm
        closure={closureData}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />

      {/* Expense Management Section */}
      {closureData.status === 'open' && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Despesas Mensais</h3>
            {addableExpenses.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddExpense(!showAddExpense)}
                disabled={expenseLoading}
              >
                {showAddExpense ? 'Cancelar' : '+ Adicionar Despesa'}
              </Button>
            )}
          </div>

          {/* Add Expense Section */}
          {showAddExpense && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Despesa cadastrada
                  </label>
                  <select
                    value={selectedNewExpenseId}
                    onChange={(e) => setSelectedNewExpenseId(e.target.value)}
                    disabled={expenseLoading}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma despesa...</option>
                    {addableExpenses.map(expense => (
                      <option key={expense.id} value={expense.id}>
                        {expense.name} - {formatCurrency(Number(expense.amount))}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAddExpense}
                  disabled={!selectedNewExpenseId || expenseLoading}
                  isLoading={expenseLoading}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Current Expenses List */}
          {closureData.expenses && closureData.expenses.length > 0 ? (
            <>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {closureData.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {expense.name}
                        </span>
                        {expense.expenseId && availableExpenses.find(e => e.id === expense.expenseId)?.isRecurring && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-1.5 py-0.5 rounded whitespace-nowrap">
                            Recorrente
                          </span>
                        )}
                      </div>
                      {expense.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                          {expense.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingAmountDisplays[expense.id] ?? Number(expense.amount).toFixed(2).replace('.', ',')}
                        onChange={(e) => {
                          const { display, numeric } = formatDecimalInput(e.target.value);
                          setEditingAmountDisplays(prev => ({ ...prev, [expense.id]: display }));
                          setEditingAmounts(prev => ({ ...prev, [expense.id]: numeric }));
                        }}
                        disabled={expenseLoading}
                        className="w-28 px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-right"
                      />
                      {editingAmounts[expense.id] !== undefined &&
                        editingAmounts[expense.id] !== Number(expense.amount) && (
                        <button
                          onClick={() => handleUpdateExpenseAmount(expense.id)}
                          disabled={expenseLoading}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-50"
                          title="Salvar valor"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveExpense(expense.id)}
                        disabled={expenseLoading}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                        title="Remover despesa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {closureData.expenses.length} despesa(s)
                </span>
                <span className="font-semibold text-red-600">
                  Total: {formatCurrency(expensesTotal)}
                </span>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400"> Nenhuma despesa neste Mês. </p>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </Modal>
  );
}
