import api from './api';
import type { AdminUser, AdminUsersResponse, AdminUserResponse, UpdateAdminUserDto } from '../types/admin';

export const adminService = {
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await api.get<AdminUsersResponse>('/users');
    return response.data.users;
  },

  async getUserById(id: string): Promise<AdminUser> {
    const response = await api.get<AdminUserResponse>(`/users/${id}`);
    return response.data.user;
  },

  async updateUser(id: string, data: UpdateAdminUserDto): Promise<AdminUser> {
    const response = await api.put<AdminUserResponse>(`/users/${id}`, data);
    return response.data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
