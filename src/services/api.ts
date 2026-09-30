/**
 * API Service for KMS BUMD
 * Connects frontend directly to the Express + MySQL backend
 */

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete (config.headers as any)['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // 1. Auth API
  auth: {
    login: (credentials: { email: string; password?: string }) =>
      request<{ success: boolean; user: any; message?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    superadminLogin: (credentials: { email: string; password?: string }) =>
      request<{ success: boolean; user: any; message?: string }>('/auth/superadmin-login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ success: boolean; user: any; requiresOrgJoin: boolean; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    updateProfile: (userId: string, data: any) =>
      request<{ success: boolean; user: any; message: string }>(`/auth/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (userId: string, data: { oldPassword?: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>(`/auth/change-password/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // 2. Organizations API
  organizations: {
    getAll: () =>
      request<{ success: boolean; organizations: any[] }>('/organizations'),
    getById: (id: string) =>
      request<{ success: boolean; organization: any }>(`/organizations/${id}`),
    create: (orgData: any) =>
      request<{ success: boolean; organization: any; message: string }>('/organizations', {
        method: 'POST',
        body: JSON.stringify(orgData),
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string }>(`/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/organizations/${id}`, {
        method: 'DELETE',
      }),
    toggleStatus: (id: string) =>
      request<{ success: boolean; status: string; message: string }>(`/organizations/${id}/toggle-status`, {
        method: 'PATCH',
      }),
  },

  // 3. Users API
  users: {
    getAll: (organizationId?: string) => {
      const q = organizationId ? `?organizationId=${organizationId}` : '';
      return request<{ success: boolean; users: any[] }>(`/users${q}`);
    },
    create: (userData: any) =>
      request<{ success: boolean; user: any; message: string }>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    updateRole: (id: string, role: 'user' | 'admin') =>
      request<{ success: boolean; message: string }>(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    eject: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}/eject`, {
        method: 'POST',
      }),
  },

  // 4. Documents API
  documents: {
    getAll: (params?: { organizationId?: string; category?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.organizationId) sp.append('organizationId', params.organizationId);
      if (params?.category) sp.append('category', params.category);
      if (params?.search) sp.append('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return request<{ success: boolean; documents: any[] }>(`/documents${query}`);
    },
    getById: (id: string) =>
      request<{ success: boolean; document: any }>(`/documents/${id}`),
    upload: (formData: FormData) =>
      request<{ success: boolean; document: any; message: string }>('/documents/upload', {
        method: 'POST',
        body: formData,
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  },

  // 5. Activity Logs API
  activities: {
    getAll: (params?: { organizationId?: string; type?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.organizationId) sp.append('organizationId', params.organizationId);
      if (params?.type) sp.append('type', params.type);
      if (params?.search) sp.append('search', params.search);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return request<{ success: boolean; logs: any[] }>(`/activities${query}`);
    },
    clear: (organizationId?: string) => {
      const q = organizationId ? `?organizationId=${organizationId}` : '';
      return request<{ success: boolean; message: string }>(`/activities/clear${q}`, {
        method: 'DELETE',
      });
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/activities/${id}`, {
        method: 'DELETE',
      }),
  },

  // 6. Join Requests & Membership API
  membership: {
    join: (userId: string, organizationId: string) =>
      request<{ success: boolean; organization: any; message: string }>('/join-requests/join', {
        method: 'POST',
        body: JSON.stringify({ userId, organizationId }),
      }),
    leave: (userId: string) =>
      request<{ success: boolean; message: string }>('/join-requests/leave', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
  },

  // 7. Stats & Dashboard API
  stats: {
    getDashboard: (params?: { organizationId?: string; role?: string }) => {
      const sp = new URLSearchParams();
      if (params?.organizationId) sp.append('organizationId', params.organizationId);
      if (params?.role) sp.append('role', params.role);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return request<{ success: boolean; stats: any }>(`/stats/dashboard${query}`);
    },
  },
};
