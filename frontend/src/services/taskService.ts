import api from './api';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  TasksResponse,
  TaskResponse,
  DuplicateTaskDto,
} from '../types/task';

export const taskService = {
  /**
   * Get all tasks with filters and pagination
   */
  async getAll(filters?: TaskFilters): Promise<TasksResponse> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.taskTypeId) params.append('taskTypeId', filters.taskTypeId);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<TasksResponse>(`/tasks?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<Task> {
    const response = await api.get<TaskResponse>(`/tasks/${id}`);
    return response.data.task;
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto): Promise<Task> {
    const response = await api.post<TaskResponse>('/tasks', data);
    return response.data.task;
  },

  /**
   * Update a task
   */
  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
    return response.data.task;
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Toggle task status (pending <-> completed)
   */
  async toggleStatus(id: string): Promise<Task> {
    const response = await api.patch<TaskResponse>(`/tasks/${id}/status`);
    return response.data.task;
  },

  /**
   * Duplicate a task with optional new date
   */
  async duplicate(id: string, data?: DuplicateTaskDto): Promise<Task> {
    const response = await api.post<TaskResponse>(`/tasks/${id}/duplicate`, data || {});
    return response.data.task;
  },
};
