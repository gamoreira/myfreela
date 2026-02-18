export interface TaskType {
  id: string;
  userId: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskTypeDto {
  name: string;
  color: string;
  isActive?: boolean;
}

export interface UpdateTaskTypeDto {
  name?: string;
  color?: string;
  isActive?: boolean;
}

export interface TaskTypeStats {
  taskType: {
    id: string;
    name: string;
    color: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalHours: number;
  };
}

export interface TaskTypesResponse {
  taskTypes: TaskType[];
  total: number;
}

export interface TaskTypeResponse {
  taskType: TaskType;
}
