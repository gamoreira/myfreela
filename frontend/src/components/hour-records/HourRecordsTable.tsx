import { useState, useMemo } from 'react';
import { Input } from '../common';
import type { HourRecord } from '../../types/hourRecord';

interface HourRecordsTableProps {
  hourRecords: HourRecord[];
  onEdit: (hourRecord: HourRecord) => void;
  onDelete: (hourRecord: HourRecord) => void;
  showTaskInfo?: boolean;
}

export default function HourRecordsTable({
  hourRecords,
  onEdit,
  onDelete,
  showTaskInfo = true,
}: HourRecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'workDate' | 'hoursWorked'>('workDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = hourRecords;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.task?.taskNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.task?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'workDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [hourRecords, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: 'workDate' | 'hoursWorked') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'workDate' ? 'desc' : 'asc');
    }
  };

  const formatDate = (dateString: string) => {
    // Extract date parts directly to avoid timezone conversion issues
    // Date may come as "2024-01-15" or "2024-01-15T00:00:00.000Z"
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const SortIcon = ({ field }: { field: 'workDate' | 'hoursWorked' }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const totalHours = useMemo(() => {
    return filteredAndSortedRecords.reduce((sum, record) => sum + Number(record.hoursWorked), 0);
  }, [filteredAndSortedRecords]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descrição ou tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('workDate')}
              >
                <div className="flex items-center gap-2">
                  Data
                  <SortIcon field="workDate" />
                </div>
              </th>
              {showTaskInfo && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tarefa
                </th>
              )}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('hoursWorked')}
              >
                <div className="flex items-center gap-2">
                  Horas
                  <SortIcon field="hoursWorked" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(record.workDate)}
                </td>
                {showTaskInfo && record.task && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.task.taskNumber}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{record.task.name}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {Number(record.hoursWorked).toFixed(2)}h
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                    {record.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(record)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(record)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      title="Deletar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedRecords.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum registro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Tente ajustar o filtro de busca.'
                : 'Comece registrando as horas trabalhadas.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredAndSortedRecords.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-lg flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Mostrando <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedRecords.length}</span> de{' '}
            <span className="font-medium text-gray-900 dark:text-white">{hourRecords.length}</span> registros
          </div>
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-300">Total de horas: </span>
            <span className="font-bold text-gray-900 dark:text-white">{totalHours.toFixed(2)}h</span>
          </div>
        </div>
      )}
    </div>
  );
}
