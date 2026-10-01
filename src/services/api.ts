/**
 * API Service for KMS BUMD
 * Connects frontend directly to the Express + MySQL backend
 */

const BASE_URL = '/api';

// ---- JWT Token Management ----
const TOKEN_KEY = 'kms_auth_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete (config.headers as any)['Content-Type'];
  }

  const response = await fetch(url, config);
  let data: any = {};
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || `HTTP ${response.status}` };
  }

  // Expired/invalid session on a protected endpoint: reset session and go to login.
  // (Auth endpoints are excluded so a wrong-password attempt doesn't trigger this.)
  // Public pages (landing, login, register) must never be yanked to /login:
  // an anonymous/stale visitor there just loses the stale token quietly.
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    tokenStore.clear();
    localStorage.removeItem('kms_current_user');
    const publicPaths = ['/', '/landing', '/login', '/register', '/forgot-password'];
    const onPublicPage = publicPaths.includes(window.location.pathname);
    if (!onPublicPage) {
      window.location.assign('/login');
    }
    throw new Error(data.message || 'Sesi berakhir. Silakan login ulang.');
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Download a protected file with the JWT attached (fetch -> blob -> browser save).
 * Plain <a href> links cannot send Authorization headers, so downloads would get 401.
 */
export async function downloadProtectedFile(url: string, filename: string): Promise<void> {
  let downloadUrl = url;
  if (downloadUrl.startsWith('db://')) {
    const docId = downloadUrl.replace('db://', '');
    downloadUrl = `/api/documents/${docId}/download`;
  }

  // Handle external CDN URLs
  if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
    try {
      const res = await fetch(downloadUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch {
      // Fallback: direct browser open/download
      window.open(downloadUrl, '_blank');
      return;
    }
  }

  const token = tokenStore.get();
  const res = await fetch(downloadUrl, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = `Gagal mengunduh berkas (HTTP ${res.status}).`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch { /* not JSON */ }
    throw new Error(message);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  // 1. Auth API
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any; message?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    superadminLogin: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any; message?: string }>('/auth/superadmin-login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ success: boolean; token: string; user: any; requiresOrgJoin: boolean; message: string }>('/auth/register', {
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
    setStatus: (id: string, status: 'active' | 'inactive') =>
      request<{ success: boolean; status: string; message: string }>(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    resetPassword: (id: string, newPassword: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
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
    syncRag: () =>
      request<{ success: boolean; message: string; count: number }>('/documents/sync-rag', {
        method: 'POST',
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
    getAll: () =>
      request<{ success: boolean; requests: any[] }>('/join-requests'),
    join: (userId: string, organizationId: string, reason?: string, department?: string) =>
      request<{ success: boolean; status: 'joined' | 'pending'; message: string; requestId?: string }>('/join-requests/join', {
        method: 'POST',
        body: JSON.stringify({ userId, organizationId, reason, department }),
      }),
    approve: (requestId: string) =>
      request<{ success: boolean; message: string }>(`/join-requests/${requestId}/approve`, {
        method: 'POST',
      }),
    reject: (requestId: string) =>
      request<{ success: boolean; message: string }>(`/join-requests/${requestId}/reject`, {
        method: 'POST',
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

  // 8. Chat & RAG Knowledge API
  chat: {
    query: (params: { query: string; organizationId?: string | null; documentIds?: string[] }) =>
      request<{
        success: boolean;
        answer: string;
        grounded: boolean;
        sources: Array<{
          document_id: string;
          document_name: string;
          chunk_id?: string;
          page?: number;
          score?: number;
          section?: string;
        }>;
        usage?: any;
        model?: string;
        error?: string;
      }>('/chat/query', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    status: () =>
      request<{
        success: boolean;
        service: string;
        status: string;
        details?: Record<string, any>;
      }>('/chat/status'),
  },
};
