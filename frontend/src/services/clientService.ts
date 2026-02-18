import api from './api';
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientsResponse,
  ClientResponse,
  ClientClosuresResponse,
} from '../types/client';

export const clientService = {
  /**
   * Get all clients for the authenticated user
   */
  async getAll(): Promise<Client[]> {
    const response = await api.get<ClientsResponse>('/clients');
    return response.data.clients;
  },

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<Client> {
    const response = await api.get<ClientResponse>(`/clients/${id}`);
    return response.data.client;
  },

  /**
   * Create a new client
   */
  async create(data: CreateClientDto): Promise<Client> {
    const response = await api.post<ClientResponse>('/clients', data);
    return response.data.client;
  },

  /**
   * Update a client
   */
  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.put<ClientResponse>(`/clients/${id}`, data);
    return response.data.client;
  },

  /**
   * Delete a client (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  /**
   * Get client's monthly closures history
   */
  async getClosures(id: string): Promise<ClientClosuresResponse> {
    const response = await api.get<ClientClosuresResponse>(`/clients/${id}/closures`);
    return response.data;
  },
};
