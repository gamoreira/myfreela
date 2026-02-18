export interface Client {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  isActive?: boolean;
}

export interface ClientClosure {
  id: string;
  clientId: string;
  monthlyClosureId: string;
  totalHours: number;
  totalRevenue: number;
  monthlyClosure: {
    id: string;
    month: number;
    year: number;
    status: string;
    closedAt: string | null;
  };
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
}

export interface ClientResponse {
  client: Client;
}

export interface ClientClosuresResponse {
  client: {
    id: string;
    name: string;
  };
  closures: ClientClosure[];
  total: number;
}
