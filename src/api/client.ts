import { User, Ticket, DashboardMetrics, TicketCategory, TicketPriority, TicketStatus } from '../types';

const TOKEN_KEY = 'edusupport_auth_token';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      this.clearToken();
      // Only reload if not already on login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired or unauthorized');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  }

  // Auth
  public async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.clearToken();
    }
  }

  // Users
  public async getUsers(role?: string): Promise<{ users: User[] }> {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return this.request<{ users: User[] }>(`/users${query}`);
  }

  // Tickets
  public async getTickets(params: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedStaffId?: string;
    view?: string;
  } = {}): Promise<{ tickets: Ticket[] }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.category) query.append('category', params.category);
    if (params.assignedStaffId) query.append('assignedStaffId', params.assignedStaffId);
    if (params.view) query.append('view', params.view);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ tickets: Ticket[] }>(`/tickets${queryString}`);
  }

  public async getTicket(id: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}`);
  }

  public async createTicket(data: {
    category: TicketCategory;
    subject: string;
    description: string;
    priority: TicketPriority;
  }): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateStatus(
    id: string,
    status: TicketStatus,
    resolutionNotes?: string
  ): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNotes }),
    });
  }

  public async updatePriority(id: string, priority: TicketPriority): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  }

  public async assignTicket(id: string, staffId: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ staffId }),
    });
  }

  public async addComment(id: string, content: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  public async addInternalNote(id: string, content: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  public async escalateTicket(id: string, reason: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${encodeURIComponent(id)}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Dashboard
  public async getDashboardStats(): Promise<{ metrics: DashboardMetrics }> {
    return this.request<{ metrics: DashboardMetrics }>('/dashboard/stats');
  }

  // Reset Demo
  public async resetDemo(): Promise<void> {
    await this.request('/reset-demo', { method: 'POST' });
  }
}

export const api = new ApiClient();
