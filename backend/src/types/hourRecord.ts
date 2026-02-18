export interface CreateHourRecordDto {
  taskItemId: string;
  workDate: string; // ISO date string
  hoursWorked: number;
  description?: string;
}

export interface UpdateHourRecordDto {
  workDate?: string;
  hoursWorked?: number;
  description?: string;
}
