export interface CreateTaskItemDto {
  taskNumber: string;
  name: string;
  description?: string;
  estimatedHours: number;
}

export interface UpdateTaskItemDto {
  taskNumber?: string;
  name?: string;
  description?: string;
  estimatedHours?: number;
}

export interface TaskItemWithStats {
  id: string;
  userId: string;
  taskNumber: string;
  name: string;
  description?: string;
  estimatedHours: number;
  totalHoursSpent: number;
  percentageComplete: number;
  status: 'on-track' | 'near-limit' | 'exceeded';
  createdAt: Date;
  updatedAt: Date;
}
