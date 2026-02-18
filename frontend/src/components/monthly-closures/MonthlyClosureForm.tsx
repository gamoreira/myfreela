import { useState, useEffect } from 'react';
import { Input, Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import { expenseService } from '../../services/expenseService';
import type {
  MonthlyClosure,
  CreateMonthlyClosureDto,
  UpdateMonthlyClosureDto,
} from '../../types/monthlyClosure';
import type { Expense } from '../../types/expense';

interface MonthlyClosureFormProps {
  closure?: MonthlyClosure;
  onSubmit: (data: CreateMonthlyClosureDto | UpdateMonthlyClosureDto) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

interface AddedExpense {
  expenseId: string;
  name: string;
  description: string | null;
  amount: number;
  isRecurring: boolean;
}

function toNumericRate(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getClosureHourlyRate(c: MonthlyClosure | undefined): unknown {
  if (!c) return undefined;
  return (c as { hourlyRate?: unknown; hourly_rate?: unknown }).hourlyRate
    ?? (c as { hourly_rate?: unknown }).hourly_rate;
}

export default function MonthlyClosureForm({
  closure,
  onSubmit,
  onCancel,
  isLoading,
}: MonthlyClosureFormProps) {
  const { user } = useAuth();
  const currentDate = new Date();
  const defaultMonth = currentDate.getMonth() + 1;
  const defaultYear = currentDate.getFullYear();

  const defaultTax = closure?.taxPercentage || user?.defaultTaxPercentage || 0;

  const [month, setMonth] = useState(closure?.month || defaultMonth);
  const [year, setYear] = useState(closure?.year || defaultYear);
  const [taxPercentage, setTaxPercentage] = useState(defaultTax);
  const [hourlyRate, setHourlyRate] = useState(toNumericRate(getClosureHourlyRate(closure)));
  const [notes, setNotes] = useState(closure?.notes || '');
  const [taxPercentageDisplay, setTaxPercentageDisplay] = useState(
    Number(defaultTax).toFixed(2).replace('.', ',')
  );
  const [hourlyRateDisplay, setHourlyRateDisplay] = useState(
    toNumericRate(getClosureHourlyRate(closure)).toFixed(2).replace('.', ',')
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expense state (only for creating new closures)
  const [availableExpenses, setAvailableExpenses] = useState<Expense[]>([]);
  const [addedExpenses, setAddedExpenses] = useState<AddedExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseAmountDisplays, setExpenseAmountDisplays] = useState<Record<string, string>>({});
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedNewExpenseId, setSelectedNewExpenseId] = useState('');

  useEffect(() => {
    if (closure) {
      setMonth(closure.month);
      setYear(closure.year);
      setTaxPercentage(closure.taxPercentage);
      setTaxPercentageDisplay(Number(closure.taxPercentage).toFixed(2).replace('.', ','));
      setHourlyRate(toNumericRate(getClosureHourlyRate(closure)));
      setHourlyRateDisplay(toNumericRate(getClosureHourlyRate(closure)).toFixed(2).replace('.', ','));
      setNotes(closure.notes || '');
    }
  }, [closure]);

  // Load available expenses when creating new closure
  useEffect(() => {
    if (!closure) {
      loadExpenses();
    }
  }, [closure]);

  const loadExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const expenses = await expenseService.getAll(false); // Only active
      setAvailableExpenses(expenses);

      // Pre-add recurring expenses
      const recurring: AddedExpense[] = expenses
        .filter(e => e.isRecurring)
        .map(e => ({
          expenseId: e.id,
          name: e.name,
          description: e.description,
          amount: Number(e.amount),
          isRecurring: true,
        }));
      setAddedExpenses(recurring);

      // Initialize amount displays for pre-added expenses
      const displays: Record<string, string> = {};
      recurring.forEach(e => {
        displays[e.expenseId] = e.amount.toFixed(2).replace('.', ',');
      });
      setExpenseAmountDisplays(displays);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoadingExpenses(false);
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

  // Addable expenses (active expenses not yet added)
  const addedExpenseIds = new Set(addedExpenses.map(e => e.expenseId));
  const addableExpenses = availableExpenses.filter(e => !addedExpenseIds.has(e.id));

  const addedExpensesTotal = addedExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleAddExpenseLocal = () => {
    const expense = availableExpenses.find(e => e.id === selectedNewExpenseId);
    if (!expense) return;

    const newExpense: AddedExpense = {
      expenseId: expense.id,
      name: expense.name,
      description: expense.description,
      amount: Number(expense.amount),
      isRecurring: expense.isRecurring,
    };
    setAddedExpenses(prev => [...prev, newExpense]);
    setExpenseAmountDisplays(prev => ({
      ...prev,
      [expense.id]: Number(expense.amount).toFixed(2).replace('.', ','),
    }));
    setSelectedNewExpenseId('');
    setShowAddExpense(false);
  };

  const handleRemoveExpenseLocal = (expenseId: string) => {
    setAddedExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
    setExpenseAmountDisplays(prev => {
      const next = { ...prev };
      delete next[expenseId];
      return next;
    });
  };

  const handleUpdateExpenseAmountLocal = (expenseId: string, amount: number) => {
    setAddedExpenses(prev => prev.map(e =>
      e.expenseId === expenseId ? { ...e, amount } : e
    ));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!month || month < 1 || month > 12) {
      newErrors.month = 'Selecione um mês válido';
    }

    if (!year || year < 2000 || year > 2100) {
      newErrors.year = 'Informe um ano válido (2000-2100)';
    }

    if (taxPercentage === null || taxPercentage === undefined || taxPercentage < 0 || taxPercentage > 100) {
      newErrors.taxPercentage = 'A porcentagem de imposto deve estar entre 0 e 100';
    }

    if (hourlyRate === null || hourlyRate === undefined || hourlyRate <= 0) {
      newErrors.hourlyRate = 'Valor da hora é obrigatório e deve ser positivo';
    }

    if (notes && notes.length > 5000) {
      newErrors.notes = 'As notas devem ter no máximo 5000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const safeHourlyRate = toNumericRate(hourlyRate);
    const data: CreateMonthlyClosureDto | UpdateMonthlyClosureDto = closure
      ? {
          taxPercentage,
          hourlyRate: safeHourlyRate > 0 ? safeHourlyRate : undefined,
          notes: notes || undefined,
        }
      : {
          month,
          year,
          taxPercentage,
          hourlyRate: safeHourlyRate,
          notes: notes || undefined,
          expenses: addedExpenses.length > 0
            ? addedExpenses.map(e => ({
                expenseId: e.expenseId,
                amount: e.amount,
              }))
            : undefined,
        };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Month - disabled when editing */}
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Mês *
          </label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            disabled={!!closure || isLoading}
            className={`
              w-full px-3 py-2.5
              bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
              border ${errors.month ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'}
              rounded-lg shadow-sm
              focus:outline-none focus:ring-2
              transition-all duration-200
              ${!!closure || isLoading ? 'bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed' : ''}
            `}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.month && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.month}</p>}
        </div>

        {/* Year - disabled when editing */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Ano *
          </label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!!closure || isLoading}
            min={2000}
            max={2100}
            error={errors.year}
          />
        </div>
      </div>

      {/* Tax Percentage and Hourly Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taxPercentage" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Porcentagem de Imposto (%) *
          </label>
          <Input
            id="taxPercentage"
            type="text"
            inputMode="decimal"
            value={taxPercentageDisplay}
            onChange={(e) => {
              const { display, numeric } = formatDecimalInput(e.target.value);
              setTaxPercentageDisplay(display);
              setTaxPercentage(numeric);
            }}
            disabled={isLoading}
            error={errors.taxPercentage}
            placeholder="Ex: 15,50"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Imposto que será aplicado sobre o valor bruto
          </p>
        </div>

        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Valor da Hora no Mês (R$) *
          </label>
          <Input
            id="hourlyRate"
            type="text"
            inputMode="decimal"
            value={hourlyRateDisplay}
            onChange={(e) => {
              const { display, numeric } = formatDecimalInput(e.target.value);
              setHourlyRateDisplay(display);
              setHourlyRate(numeric);
            }}
            disabled={isLoading}
            error={errors.hourlyRate}
            placeholder="Ex: 100,00"
            icon={<span className="text-gray-500 font-medium">R$</span>}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Este valor será aplicado a todos os clientes
          </p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Observações
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={4}
          maxLength={5000}
          className={`
            w-full px-3 py-2.5
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
            border ${errors.notes ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'}
            rounded-lg shadow-sm
            focus:outline-none focus:ring-2
            transition-all duration-200
            resize-none
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          `}
          placeholder="Adicione observações sobre este faturamento (opcional)"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{notes.length}/5000 caracteres</p>
      </div>

      {/* Expense Section - only for new closures, same layout as edit screen */}
      {!closure && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Despesas do Faturamento</h3>
            {!loadingExpenses && addableExpenses.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAddExpense(!showAddExpense)}
                disabled={isLoading}
              >
                {showAddExpense ? 'Cancelar' : '+ Adicionar Despesa'}
              </Button>
            )}
          </div>

          {loadingExpenses ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              Carregando despesas...
            </div>
          ) : availableExpenses.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma despesa cadastrada.{' '}
                <a href="/expenses" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Cadastre despesas
                </a>{' '}
                para incluir nos faturamentos.
              </p>
            </div>
          ) : (
            <>
              {/* Add Expense Section */}
              {showAddExpense && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Despesa cadastrada
                      </label>
                      <select
                        value={selectedNewExpenseId}
                        onChange={(e) => setSelectedNewExpenseId(e.target.value)}
                        disabled={isLoading}
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
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleAddExpenseLocal}
                      disabled={!selectedNewExpenseId || isLoading}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              {/* Added Expenses List */}
              {addedExpenses.length > 0 ? (
                <>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {addedExpenses.map((expense) => (
                      <div
                        key={expense.expenseId}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {expense.name}
                            </span>
                            {expense.isRecurring && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded whitespace-nowrap">
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
                            value={expenseAmountDisplays[expense.expenseId] ?? expense.amount.toFixed(2).replace('.', ',')}
                            onChange={(e) => {
                              const { display, numeric } = formatDecimalInput(e.target.value);
                              setExpenseAmountDisplays(prev => ({ ...prev, [expense.expenseId]: display }));
                              handleUpdateExpenseAmountLocal(expense.expenseId, numeric);
                            }}
                            disabled={isLoading}
                            className="w-28 px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed text-right"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExpenseLocal(expense.expenseId)}
                            disabled={isLoading}
                            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
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
                      {addedExpenses.length} despesa(s)
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Total: {formatCurrency(addedExpensesTotal)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma despesa adicionada.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {closure ? 'Atualizar Faturamento' : 'Criar Faturamento'}
        </Button>
      </div>
    </form>
  );
}
