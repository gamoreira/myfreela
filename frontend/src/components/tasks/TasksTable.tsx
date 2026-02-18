import { useState, Fragment } from 'react';
import { Button } from '../common';
import TaskDetails from './TaskDetails';
import TaskHourRecordsModal from './TaskHourRecordsModal';
import type { Task } from '../../types/task';

interface TasksTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onUpdate?: () => void;
}

export default function TasksTable({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdate,
}: TasksTableProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskForHourRecords, setTaskForHourRecords] = useState<Task | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const truncateText = (text: string | null | undefined, maxLength: number = 45) => {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tarefa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estimativa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Horas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const allowHourRecords = !!task.taskNumber; // Allow hour records for any task with taskNumber
                return (
                  <Fragment key={task.id}>
                    <tr
                      onClick={() => toggleExpand(task.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="mr-2 mt-1 text-gray-400 dark:text-gray-500">
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                expandedTask === task.id ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium text-gray-900 dark:text-white ${
                                expandedTask === task.id ? '' : 'truncate'
                              }`}
                              title={task.name}
                            >
                              {task.taskNumber && `[${task.taskNumber}] `}
                              {truncateText(task.name)}
                            </p>
                          </div>
                        </div>
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{task.client.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${task.taskType.color}20`,
                        color: task.taskType.color,
                      }}
                    >
                      {task.taskType.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(task.creationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{task.hoursSpent}h</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(task);
                      }}
                      className="group relative"
                      title={`Marcar como ${task.status === 'completed' ? 'pendente' : 'concluída'}`}
                    >
                      {task.status === 'completed' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors">
                          <svg className="w-3 h-3 mr-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Concluída
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors">
                          <svg className="w-3 h-3 mr-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pendente
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {allowHourRecords && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTaskForHourRecords(task)}
                          title={task.status === 'completed' ? 'Não é possível adicionar horas em tarefa concluída' : 'Registros de horas'}
                          disabled={task.status === 'completed'}
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          }
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(task)}
                        title={task.status === 'completed' ? 'Não é possível editar tarefa concluída' : 'Editar tarefa'}
                        disabled={task.status === 'completed'}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        }
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(task)}
                        title={task.status === 'completed' ? 'Não é possível excluir tarefa concluída' : 'Excluir tarefa'}
                        disabled={task.status === 'completed'}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        }
                      />
                    </div>
                  </td>
                </tr>
                {expandedTask === task.id && (
                  <tr>
                    <td colSpan={8} className="px-0 py-0 bg-gray-50 dark:bg-gray-900">
                      <div className="px-6 py-6">
                        {allowHourRecords ? (
                          <TaskDetails task={task} />
                        ) : (
                          task.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                              {task.description}
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
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
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hour Records Modal */}
      {taskForHourRecords && (
        <TaskHourRecordsModal
          isOpen={true}
          onClose={() => setTaskForHourRecords(null)}
          task={taskForHourRecords}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
