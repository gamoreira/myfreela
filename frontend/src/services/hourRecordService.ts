import api from './api';
import type {
  HourRecord,
  CreateHourRecordDto,
  UpdateHourRecordDto,
  HourRecordFilters,
} from '../types/hourRecord';

interface HourRecordsResponse {
  hourRecords: HourRecord[];
  total?: number;
}

interface HourRecordResponse {
  message?: string;
  hourRecord: HourRecord;
}

export const hourRecordService = {
  /**
   * Get all hour records for the authenticated user
   */
  async getAll(filters?: HourRecordFilters): Promise<HourRecord[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<HourRecordsResponse>(
      `/hour-records${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.hourRecords;
  },

  /**
   * Get hour records by task
   */
  async getByTask(taskId: string): Promise<HourRecord[]> {
    const response = await api.get<HourRecordsResponse>(`/hour-records/task/${taskId}`);
    return response.data.hourRecords;
  },

  /**
   * Get a single hour record by ID
   */
  async getById(id: string): Promise<HourRecord> {
    const response = await api.get<HourRecordResponse>(`/hour-records/${id}`);
    return response.data.hourRecord;
  },

  /**
   * Create a new hour record
   */
  async create(data: CreateHourRecordDto): Promise<HourRecord> {
    const response = await api.post<HourRecordResponse>('/hour-records', data);
    return response.data.hourRecord;
  },

  /**
   * Update an hour record
   */
  async update(id: string, data: UpdateHourRecordDto): Promise<HourRecord> {
    const response = await api.put<HourRecordResponse>(`/hour-records/${id}`, data);
    return response.data.hourRecord;
  },

  /**
   * Delete an hour record
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/hour-records/${id}`);
  },
};
