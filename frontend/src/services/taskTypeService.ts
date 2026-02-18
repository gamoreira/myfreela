import api from './api';
import type {
  TaskType,
  CreateTaskTypeDto,
  UpdateTaskTypeDto,
  TaskTypesResponse,
  TaskTypeResponse,
  TaskTypeStats,
} from '../types/taskType';

export const taskTypeService = {
  /**
   * Get all task types for the authenticated user
   */
  async getAll(): Promise<TaskType[]> {
    const response = await api.get<TaskTypesResponse>('/task-types');
    return response.data.taskTypes;
  },

  /**
   * Get a single task type by ID
   */
  async getById(id: string): Promise<TaskType> {
    const response = await api.get<TaskTypeResponse>(`/task-types/${id}`);
    return response.data.taskType;
  },

  /**
   * Create a new task type
   */
  async create(data: CreateTaskTypeDto): Promise<TaskType> {
    const response = await api.post<TaskTypeResponse>('/task-types', data);
    return response.data.taskType;
  },

  /**
   * Update a task type
   */
  async update(id: string, data: UpdateTaskTypeDto): Promise<TaskType> {
    const response = await api.put<TaskTypeResponse>(`/task-types/${id}`, data);
    return response.data.taskType;
  },

  /**
   * Delete a task type (soft or hard delete depending on usage)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/task-types/${id}`);
  },

  /**
   * Get task type statistics
   */
  async getStats(id: string): Promise<TaskTypeStats> {
    const response = await api.get<TaskTypeStats>(`/task-types/${id}/stats`);
    return response.data;
  },
};
