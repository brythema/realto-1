import { UserProfile, UserRole, AccountStatus } from '../types/roles';
import { Property } from '../types/property';
import { Developer } from '../types/developer';
import { ChangeRequest } from '../types/change-request';
import { Thread } from '../types/thread';
import { Notification, AuditLog } from '../types/notification';

const TOKEN_KEY = 'realto_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ token: string; user: UserProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request<{ user: UserProfile }>('/auth/me'),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      }),
    getDemoAccounts: () =>
      request<
        Array<{
          role: string;
          name: string;
          email: string;
          password: string;
          description: string;
        }>
      >('/auth/demo-accounts'),
  },

  properties: {
    getPublic: (filters: Record<string, any> = {}) => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '' && v !== null) {
          q.set(k, String(v));
        }
      }
      return request<{
        data: Property[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/properties?${q.toString()}`);
    },
    getById: (id: string) => request<Property>(`/properties/${id}`),
    getMyProperties: () => request<Property[]>('/my-properties'),
    createDraft: (draft: Partial<Property>) =>
      request<Property>('/properties/draft', {
        method: 'POST',
        body: JSON.stringify(draft),
      }),
    updateDraft: (id: string, updates: Partial<Property>) =>
      request<Property>(`/properties/draft/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    deleteDraft: (id: string) =>
      request<{ success: boolean }>(`/properties/draft/${id}`, {
        method: 'DELETE',
      }),
    submit: (id: string) =>
      request<{ success: boolean; changeRequestId: string }>(`/properties/${id}/submit`, {
        method: 'POST',
      }),
    requestEdit: (id: string, proposedData: Record<string, any>) =>
      request<{ success: boolean; changeRequestId: string }>(`/properties/${id}/request-edit`, {
        method: 'POST',
        body: JSON.stringify({ proposedData }),
      }),
    requestDelete: (id: string, reason?: string) =>
      request<{ success: boolean; changeRequestId: string }>(`/properties/${id}/request-delete`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    requestMarkSold: (id: string) =>
      request<{ success: boolean; changeRequestId: string }>(`/properties/${id}/mark-sold`, {
        method: 'POST',
      }),
  },

  developers: {
    getAll: () => request<Developer[]>('/developers'),
    getBySlug: (slug: string) =>
      request<{ developer: Developer; properties: Property[] }>(`/developers/${slug}`),
  },

  cart: {
    get: () => request<{ cartIds: string[]; properties: Property[] }>('/cart'),
    toggle: (propertyId: string) =>
      request<{ cartIds: string[] }>('/cart/toggle', {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      }),
  },

  enquiries: {
    submit: (propertyId: string, messageBody: string) =>
      request<{ thread: Thread; whatsappUrl: string }>('/enquiries', {
        method: 'POST',
        body: JSON.stringify({ propertyId, messageBody }),
      }),
    getThreads: () => request<Thread[]>('/threads'),
    sendMessage: (threadId: string, body: string) =>
      request<Thread>(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    closeThread: (threadId: string) =>
      request<Thread>(`/threads/${threadId}/close`, {
        method: 'POST',
      }),
  },

  notifications: {
    getAll: () => request<Notification[]>('/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'POST',
      }),
  },

  admin: {
    getChangeRequests: () => request<ChangeRequest[]>('/admin/change-requests'),
    approveChangeRequest: (id: string) =>
      request<{ success: boolean }>(`/admin/change-requests/${id}/approve`, {
        method: 'POST',
      }),
    rejectChangeRequest: (id: string, reason: string) =>
      request<{ success: boolean }>(`/admin/change-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getUsers: () => request<UserProfile[]>('/admin/users'),
    suspendUser: (id: string, reason: string) =>
      request<{ success: boolean }>(`/admin/users/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    reactivateUser: (id: string) =>
      request<{ success: boolean }>(`/admin/users/${id}/reactivate`, {
        method: 'POST',
      }),
    togglePropertyVisibility: (id: string, isPublic: boolean, reason: string) =>
      request<{ success: boolean; isPublic: boolean }>(`/admin/properties/${id}/toggle-visibility`, {
        method: 'POST',
        body: JSON.stringify({ isPublic, reason }),
      }),
    setPropertyAvailability: (id: string, availability: string) =>
      request<Property>(`/admin/properties/${id}/set-availability`, {
        method: 'POST',
        body: JSON.stringify({ availability }),
      }),
    getAuditLogs: () => request<AuditLog[]>('/admin/audit-logs'),
    resetDatabase: () =>
      request<{ success: boolean }>('/admin/reset-database', {
        method: 'POST',
      }),
  },

  upload: {
    uploadFile: (filename: string, fileData: string, mimeType?: string) =>
      request<{ url: string; filename: string; size: number }>('/upload', {
        method: 'POST',
        body: JSON.stringify({ filename, fileData, mimeType }),
      }),
  },
};
