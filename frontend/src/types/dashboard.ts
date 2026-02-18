export interface DashboardOverview {
  currentMonth: {
    month: number;
    year: number;
    hours: number;
    revenue: number;
    completedTasks: number;
    pendingTasks: number;
    closureStatus: string;
  };
  totalClients: number;
  recentTasks: RecentTask[];
  topClients: TopClient[];
}

export interface RecentTask {
  id: string;
  title: string;
  description: string | null;
  hoursSpent: number;
  status: 'pending' | 'completed';
  creationDate: string;
  client: {
    id: string;
    name: string;
  };
  taskType: {
    id: string;
    name: string;
    color: string;
  };
}

export interface TopClient {
  id: string;
  name: string;
  hours: number;
  revenue: number;
}

export interface RevenueStats {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    hours: number;
    revenue: number;
    tasksCount: number;
  };
  byClient: ClientRevenue[];
}

export interface ClientRevenue {
  id: string;
  name: string;
  hours: number;
  revenue: number;
}

export interface ProductivityStats {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totals: {
    hours: number;
    tasksCount: number;
    dailyAverage: number;
  };
  byTaskType: TaskTypeStats[];
}

export interface TaskTypeStats {
  id: string;
  name: string;
  color: string;
  hours: number;
  count: number;
  percentage: number;
}

export interface MonthlyComparison {
  months: MonthData[];
}

export interface MonthData {
  month: number;
  year: number;
  monthName: string;
  hours: number;
  revenue: number;
  tasksCount: number;
  closureStatus: string;
}
