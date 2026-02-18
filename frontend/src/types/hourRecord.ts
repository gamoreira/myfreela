export interface HourRecord {
  id: string;
  taskId: string;
  userId: string;
  workDate: string; // ISO date string
  hoursWorked: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    taskNumber?: string;
    name?: string;
    description: string;
  };
}

export interface CreateHourRecordDto {
  taskId: string;
  workDate: string; // ISO date string (YYYY-MM-DD)
  hoursWorked: number;
  description?: string;
}

export interface UpdateHourRecordDto {
  workDate?: string;
  hoursWorked?: number;
  description?: string;
}

export interface HourRecordFilters {
  taskId?: string;
  startDate?: string;
  endDate?: string;
}
