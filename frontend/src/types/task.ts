export interface HourRecord {
  id: string;
  taskId: string;
  userId: string;
  workDate: string;
  hoursWorked: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  clientId: string;
  taskTypeId: string;
  taskNumber: string;
  name: string;
  description?: string;
  estimatedHours?: number;
  hoursSpent: number;
  creationDate: string;
  status: 'pending' | 'completed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
  };
  taskType: {
    id: string;
    name: string;
    color: string;
  };
  hourRecords?: HourRecord[];
}

export interface CreateTaskDto {
  clientId: string;
  taskTypeId: string;
  taskNumber: string;
  name: string;
  description?: string;
  estimatedHours?: number;
  creationDate: string;
  status?: 'pending' | 'completed';
  tags?: string[];
}

export interface UpdateTaskDto {
  clientId?: string;
  taskTypeId?: string;
  taskNumber?: string;
  name?: string;
  description?: string;
  estimatedHours?: number;
  creationDate?: string;
  status?: 'pending' | 'completed';
  tags?: string[];
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  clientId?: string;
  taskTypeId?: string;
  status?: 'pending' | 'completed' | 'all';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalHours: number | string;
    totalTasks: number;
  };
}

export interface TaskResponse {
  task: Task;
}

export interface DuplicateTaskDto {
  creationDate?: string;
}
