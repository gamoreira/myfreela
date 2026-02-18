export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    clients: number;
    tasks: number;
    monthlyClosures: number;
    hourRecords: number;
    expenses: number;
  };
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminUserResponse {
  user: AdminUser;
}
