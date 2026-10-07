import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  MessageAttachment,
  User,
  Organization,
  DocumentItem,
  KnowledgeChunk,
  ActivityLog,
  JoinRequest,
  RagConfig,
  ChatMessage,
  CitationReference,
  UserRole
} from '../types';
import {
  initialOrganizations,
  initialUsers,
  initialDocuments,
  initialKnowledgeChunks,
  initialActivityLogs,
  initialJoinRequests,
  defaultRagConfig
} from '../data/mockData';
import { api, tokenStore } from '../services/api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  organizations: Organization[];
  users: User[];
  documents: DocumentItem[];
  chunks: KnowledgeChunk[];
  activityLogs: ActivityLog[];
  joinRequests: JoinRequest[];
  ragConfig: RagConfig;
  chatMessages: ChatMessage[];
  currentOrganization: Organization | null;
  currentProject: Organization | null;
  projects: Organization[];
  activeProjectId: string | null;
  switchProject: (projectId: string) => void;
  accessibleDocuments: DocumentItem[];
  accessibleChunks: KnowledgeChunk[];

  // Auth & Registration actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  superadminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    employeeId?: string;
    orgCode?: string
  }) => Promise<{ success: boolean; message: string; user?: User; requiresOrgJoin: boolean }>;
  logout: () => void;
  joinOrganization: (orgIdOrCode: string) => { success: boolean; message: string };
  leaveOrganization: () => void;
  joinOrganizationForCurrentUser: (orgCode: string, reason?: string) => { success: boolean; message: string; status: 'joined' | 'pending' };

  // Organization and Content Actions
  addOrganization: (newOrg: Omit<Organization, 'id' | 'documentsCount' | 'usersCount' | 'chunksCount' | 'aiQueriesCount' | 'storageUsedMb' | 'createdAt'>) => { success: boolean; message: string; org?: Organization };
  deleteOrganization: (orgId: string) => { success: boolean; message: string };
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  toggleOrgStatus: (id: string) => void;
  uploadDocument: (docData: {
    title: string;
    category: DocumentItem['category'];
    year: number;
    fileType: 'PDF' | 'DOCX' | 'XLSX';
    fileSizeKb: number;
    department: string;
    tags: string[];
    summary: string;
    organizationId?: string;
  }, file?: File) => Promise<DocumentItem>;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<DocumentItem>) => Promise<boolean>;
  approveJoinRequest: (requestId: string) => void;
  rejectJoinRequest: (requestId: string) => void;
  submitJoinRequest: (orgCode: string, name: string, email: string, dept: string, reason: string) => { success: boolean; message: string };
  updateRagConfig: (newConfig: Partial<RagConfig>) => void;
  sendChatMessage: (question: string, overrideOrgId?: string) => Promise<void>;
  clearChatHistory: (targetOrgId?: string) => void;
  addUser: (userData: Omit<User, 'id' | 'joinedAt' | 'avatarInitials'>) => void;
  editUser: (userId: string, data: Partial<User>) => void;
  removeUserFromOrg: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  setUserStatus: (userId: string, status: 'active' | 'inactive') => void;
  resetUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  refreshBackendData: () => Promise<void>;
  deleteUser: (userId: string) => void;
  clearActivityLogs: () => void;
  deleteActivityLog: (id: string) => void;

  // UI states
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedDocForViewer: DocumentItem | null;
  setSelectedDocForViewer: (doc: DocumentItem | null) => void;
  selectedChunkForInspector: KnowledgeChunk | null;
  setSelectedChunkForInspector: (chunk: KnowledgeChunk | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kms_users_store');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return initialUsers;
  });

  // Default initial active user: null (requires login/register)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kms_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return null;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('kms_orgs_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return [];
  });
  // Dokumen: di-cache di localStorage agar daftar tetap tampil saat refresh
  // (berkas fisik di CDN, metadata/URL di MySQL — cache ini hanya buffer UI)
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('kms_documents_store');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return initialDocuments;
  });
  const [chunks, setChunks] = useState<KnowledgeChunk[]>(initialKnowledgeChunks);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('kms_logs_store');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return initialActivityLogs;
  });
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(initialJoinRequests);
  const [ragConfig, setRagConfig] = useState<RagConfig>(defaultRagConfig);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<DocumentItem | null>(null);
  const [selectedChunkForInspector, setSelectedChunkForInspector] = useState<KnowledgeChunk | null>(null);

  // Theme state: 'light' or 'dark' (defaults to saved or system)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kms_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('kms_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sidebar collapsible state: true for icon-only mini sidebar, false for full sidebar
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('kms_sidebar_collapsed') === 'true';
  });

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('kms_sidebar_collapsed', String(collapsed));
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Sync users, organizations & current user to localStorage
  useEffect(() => {
    localStorage.setItem('kms_users_store', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kms_orgs_store', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kms_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kms_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kms_logs_store', JSON.stringify(activityLogs.slice(0, 50)));
  }, [activityLogs]);

  // Cache daftar dokumen (metadata + URL CDN) agar tidak hilang saat refresh
  useEffect(() => {
    localStorage.setItem('kms_documents_store', JSON.stringify(documents));
  }, [documents]);

  // Load and synchronize with MySQL backend on startup
  // Skip entirely when there is no session token: public pages (landing, login,
  // register) must not fire 401s against protected endpoints — protected data
  // is refreshed via refreshBackendData() right after login instead.
  useEffect(() => {
    if (!tokenStore.get()) return;
    refreshBackendData();
  }, []);

  async function refreshBackendData() {
    try {
        const [orgRes, usersRes, docsRes, logsRes] = await Promise.allSettled([
          api.organizations.getAll(),
          api.users.getAll(),
          api.documents.getAll(),
          api.activities.getAll()
        ]);

        // Set organizations strictly to what backend returned for this authenticated user.
        // If the user has 0 projects, set organizations to [] so other users' projects never show.
        if (orgRes.status === 'fulfilled' && orgRes.value.success) {
          const freshOrgs = orgRes.value.organizations || [];
          setOrganizations(freshOrgs);
          localStorage.setItem('kms_orgs_store', JSON.stringify(freshOrgs));
          setActiveProjectId(prev => {
            if (prev && freshOrgs.some((o: any) => o.id === prev)) return prev;
            return freshOrgs.length > 0 ? freshOrgs[0].id : null;
          });
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.success && usersRes.value.users.length > 0) {
          const orgList = (orgRes.status === 'fulfilled' && orgRes.value.success) ? orgRes.value.organizations : organizations;
          const mappedUsers = usersRes.value.users.map((u: any) => {
            if (u.organizationId && !u.organizationName) {
              const matched = orgList.find((o: any) => o.id === u.organizationId);
              if (matched) u.organizationName = matched.name;
            }
            return u;
          });
          setUsers(mappedUsers);
          localStorage.setItem('kms_users_store', JSON.stringify(mappedUsers));
        }
        if (docsRes.status === 'fulfilled' && docsRes.value.success) {
          const backendDocs = docsRes.value.documents || [];
          setDocuments(backendDocs);
          localStorage.setItem('kms_documents_store', JSON.stringify(backendDocs));
        }
        if (logsRes.status === 'fulfilled' && logsRes.value.success) {
          setActivityLogs(prev => {
            const backendLogs = logsRes.value.logs || [];
            if (backendLogs.length === 0) return prev; // backend empty: keep local logs
            return backendLogs;
          });
          localStorage.setItem('kms_logs_store', JSON.stringify(logsRes.value.logs || []));
        }
    } catch (err) {
      console.warn('[BACKEND SYNC INFO] Using local storage state:', err);
    }
  }

  // Initial chat state with realistic enterprise assistant greeting
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: 'Halo! Saya asisten KMS bertenaga RAG (Retrieval-Augmented Generation). Saya dapat mencari, menganalisis, dan merangkum seluruh dokumen serta SOP resmi yang tersimpan sesuai batasan hak akses organisasi Anda.',
      timestamp: 'Baru saja',
      organizationId: 'all'
    }
  ]);

  // Active Project ID (stored in localStorage or currentUser.organizationId)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('kms_active_project_id') || null;
  });

  // Current Organization / Project helper
  const currentOrganization = useMemo(() => {
    if (!currentUser) return null;
    const targetId = activeProjectId || currentUser.organizationId;
    if (targetId) {
      const found = organizations.find(o => o.id === targetId);
      if (found) return found;
    }
    // If user has no specific project active, default to the first available project
    if (organizations && organizations.length > 0) {
      return organizations[0];
    }
    return null;
  }, [currentUser, activeProjectId, organizations]);

  const currentProject = currentOrganization;
  const projects = organizations;

  const switchProject = (projectId: string) => {
    setActiveProjectId(projectId);
    localStorage.setItem('kms_active_project_id', projectId);
    if (currentUser) {
      const targetOrg = organizations.find(o => o.id === projectId);
      const updatedUser: User = {
        ...currentUser,
        organizationId: projectId,
        organizationName: targetOrg?.name || currentUser.organizationName
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('kms_current_user', JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      // Persist active project in MySQL backend
      api.membership.join(currentUser.id, projectId).catch(e => console.warn('[BACKEND SWITCH PROJECT ERROR]', e));
    }
  };

  // Accessible documents strictly based on active project & role
  const accessibleDocuments = useMemo(() => {
    if (!currentUser) return [];
    if (!currentOrganization) return [];
    const targetId = currentOrganization.id;

    // STRICT ISOLATION: A document must strictly belong to the currently active project
    let base = documents.filter(doc => doc.organizationId && doc.organizationId.trim() === targetId.trim());

    // Superadmin in global view (without active project) can see all documents
    if (currentUser.role === 'superadmin' && !activeProjectId) {
      base = documents;
    }

    // Role-based visibility within the project:
    // User biasa TIDAK BISA melihat dokumen yang di-upload oleh Admin.
    // User biasa hanya melihat dokumen unggahan user atau unggahan miliknya sendiri.
    // Admin & Superadmin dapat melihat SEMUA dokumen (baik unggahan admin maupun user).
    if (currentUser.role === 'user') {
      base = base.filter(doc => (doc.uploaderRole === 'user' || !doc.uploaderRole || doc.uploadedById === currentUser.id));
    }

    return base;
  }, [currentUser, activeProjectId, currentOrganization, documents]);

  // Accessible chunks strictly based on active project & role
  const accessibleChunks = useMemo(() => {
    if (!currentUser) return [];
    if (!currentOrganization) return [];
    const targetId = currentOrganization.id;

    if (currentUser.role === 'superadmin' && !activeProjectId) {
      return chunks;
    }
    return chunks.filter(c => c.organizationId && c.organizationId.trim() === targetId.trim());
  }, [currentUser, activeProjectId, currentOrganization, chunks]);

  // General login for all roles (Superadmin, Admin, User)
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!password) {
      return { success: false, message: 'Kata sandi wajib diisi.' };
    }

    try {
      // Authenticate against MySQL backend (bcrypt-validated, JWT issued)
      const res = await api.auth.login({ email: cleanEmail, password });
      if (!res.success || !res.user) {
        return { success: false, message: res.message || 'Email atau kata sandi tidak sesuai.' };
      }

      tokenStore.set(res.token);
      const backendUser = res.user as User;

      // Sync active project with user's organizationId
      if (backendUser.organizationId) {
        setActiveProjectId(backendUser.organizationId);
        localStorage.setItem('kms_active_project_id', backendUser.organizationId);
      } else {
        setActiveProjectId(null);
        localStorage.removeItem('kms_active_project_id');
      }

      setCurrentUser(backendUser);
      setUsers(prev => {
        if (prev.some(u => u.id === backendUser.id)) {
          return prev.map(u => u.id === backendUser.id ? backendUser : u);
        }
        return [...prev, backendUser];
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        organizationId: backendUser.organizationId,
        organizationName: backendUser.organizationName,
        actorName: backendUser.name,
        actorRole: backendUser.role,
        action: 'Masuk ke Platform KMS',
        target: backendUser.role === 'superadmin' ? 'Portal Superadmin' : 'Sesi Web User',
        timestamp: 'Baru saja',
        type: 'user'
      };
      setActivityLogs(prev => [log, ...prev]);

      // Session is now valid: pull fresh protected data for the app shell.
      refreshBackendData();

      return { success: true, user: backendUser };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal terhubung ke server autentikasi.' };
    }
  };

  // Dedicated Superadmin Login (password-validated against backend)
  const superadminLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    if (!password) {
      return { success: false, message: 'Kata sandi wajib diisi.' };
    }

    try {
      const res = await api.auth.superadminLogin({ email: email.trim().toLowerCase(), password });
      if (!res.success || !res.user) {
        return { success: false, message: res.message || 'Kredensial Superadmin tidak valid.' };
      }

      tokenStore.set(res.token);
      const backendUser = res.user as User;

      setCurrentUser(backendUser);
      setUsers(prev => {
        if (prev.some(u => u.id === backendUser.id)) {
          return prev.map(u => u.id === backendUser.id ? backendUser : u);
        }
        return [...prev, backendUser];
      });

      // Session is now valid: pull fresh protected data for the app shell.
      refreshBackendData();

      return { success: true, user: backendUser };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal terhubung ke server autentikasi.' };
    }
  };

  // Register New User (persisted to MySQL backend with bcrypt hash + JWT)
  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    employeeId?: string;
    orgCode?: string
  }): Promise<{ success: boolean; message: string; user?: User; requiresOrgJoin: boolean }> => {
    try {
      const res = await api.auth.register({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone,
        employeeId: data.employeeId,
        orgCode: data.orgCode
      });

      if (!res.success || !res.user) {
        return { success: false, message: res.message || 'Registrasi gagal.', requiresOrgJoin: false };
      }

      tokenStore.set(res.token);
      const backendUser = res.user as User;

      setCurrentUser(backendUser);
      setUsers(prev => {
        if (prev.some(u => u.id === backendUser.id)) return prev;
        return [...prev, backendUser];
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        organizationId: backendUser.organizationId,
        organizationName: backendUser.organizationName,
        actorName: backendUser.name,
        actorRole: 'user',
        action: 'Registrasi Akun Baru',
        target: backendUser.organizationId ? 'Bergabung ke organisasi' : 'Menunggu Gabung Organisasi',
        timestamp: 'Baru saja',
        type: 'user'
      };
      setActivityLogs(prev => [log, ...prev]);

      // Session is now valid: pull fresh protected data for the app shell.
      refreshBackendData();

      return {
        success: true,
        message: res.message || 'Registrasi berhasil!',
        user: backendUser,
        requiresOrgJoin: res.requiresOrgJoin
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal terhubung ke server pendaftaran.', requiresOrgJoin: false };
    }
  };

  // Logout - completely clean session and cached stores
  const logout = () => {
    setCurrentUser(null);
    tokenStore.clear();
    localStorage.removeItem('kms_current_user');
    localStorage.removeItem('kms_active_project_id');
    localStorage.removeItem('kms_orgs_store');
    localStorage.removeItem('kms_documents_store');
    localStorage.removeItem('kms_logs_store');
    setOrganizations([]);
    setDocuments([]);
    setActivityLogs([]);
    setActiveProjectId(null);
  };

  // Direct community-style join (no code required, 1-click)
  const joinOrganization = (orgIdOrCode: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Silakan login terlebih dahulu.' };

    const cleanInput = orgIdOrCode.trim().toLowerCase();
    const targetOrg = organizations.find(
      o => o.id.toLowerCase() === cleanInput || o.code.toLowerCase() === cleanInput
    );

    if (!targetOrg) {
      return { success: false, message: 'Organisasi tidak ditemukan dalam database KMS.' };
    }

    const previousOrgId = currentUser.organizationId;

    const updatedUser: User = {
      ...currentUser,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      orgJoinStatus: 'joined'
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Update user counts
    setOrganizations(prev => prev.map(o => {
      if (o.id === targetOrg.id && o.id !== previousOrgId) {
        return { ...o, usersCount: o.usersCount + 1 };
      }
      if (previousOrgId && o.id === previousOrgId && o.id !== targetOrg.id) {
        return { ...o, usersCount: Math.max(0, o.usersCount - 1) };
      }
      return o;
    }));

    // Record activity log
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Bergabung ke Organisasi',
      target: targetOrg.name,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    // Persist to MySQL Backend
    if (currentUser?.id) {
      api.membership.join(currentUser.id, targetOrg.id).catch(e => console.error('[BACKEND JOIN ORG ERROR]', e));
    }

    return {
      success: true,
      message: `Selamat! Anda berhasil bergabung ke organisasi ${targetOrg.name}.`
    };
  };

  const leaveOrganization = () => {
    if (!currentUser || !currentUser.organizationId) return;

    const prevOrgId = currentUser.organizationId;
    const prevOrgName = currentUser.organizationName;

    const updatedUser: User = {
      ...currentUser,
      organizationId: null,
      organizationName: null,
      orgJoinStatus: 'none'
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setOrganizations(prev => prev.map(o => o.id === prevOrgId ? { ...o, usersCount: Math.max(0, o.usersCount - 1) } : o));

    // Persist to MySQL Backend
    if (currentUser?.id) {
      api.membership.leave(currentUser.id).catch(e => console.error('[BACKEND LEAVE ORG ERROR]', e));
    }

    if (prevOrgName) {
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        organizationId: prevOrgId,
        organizationName: prevOrgName,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'Keluar dari Organisasi',
        target: prevOrgName,
        timestamp: 'Baru saja',
        type: 'user'
      };
      setActivityLogs(prev => [newLog, ...prev]);
    }
  };

  // Join organization for current logged in user (backward compatibility)
  const joinOrganizationForCurrentUser = (orgCodeOrId: string, reason?: string): { success: boolean; message: string; status: 'joined' | 'pending' } => {
    const res = joinOrganization(orgCodeOrId);
    return {
      success: res.success,
      message: res.message,
      status: 'joined'
    };
  };

  // Add Project / Organization - Available for any logged-in user to create their project
  const addOrganization = (newOrgData: Omit<Organization, 'id' | 'documentsCount' | 'usersCount' | 'chunksCount' | 'aiQueriesCount' | 'storageUsedMb' | 'createdAt'>): { success: boolean; message: string; org?: Organization } => {
    // Check unique code
    const existingWithCode = organizations.find(o => o.code.toLowerCase() === newOrgData.code.trim().toLowerCase());
    if (existingWithCode) {
      return {
        success: false,
        message: `Kode project "${newOrgData.code}" sudah digunakan oleh ${existingWithCode.name}. Silakan gunakan kode unik lain.`
      };
    }

    const newId = `org-${newOrgData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const finalKb = newOrgData.knowledgeBase || ('kb_' + (newOrgData.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const newOrg: Organization = {
      ...newOrgData,
      id: newId,
      knowledgeBase: finalKb,
      createdBy: currentUser?.id,
      documentsCount: 0,
      usersCount: 1,
      chunksCount: 0,
      aiQueriesCount: 0,
      storageUsedMb: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (currentUser) {
      newOrg.adminId = currentUser.id;
      newOrg.adminName = currentUser.name;
      newOrg.adminEmail = currentUser.email;

      const updatedUser: User = {
        ...currentUser,
        organizationId: newId,
        organizationName: newOrg.name,
        orgJoinStatus: 'joined'
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('kms_current_user', JSON.stringify(updatedUser));
      setActiveProjectId(newId);
      localStorage.setItem('kms_active_project_id', newId);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }

    setOrganizations(prev => [newOrg, ...prev]);

    // Persist to MySQL Backend
    api.organizations.create({
      id: newId,
      ...newOrgData,
      knowledgeBase: finalKb,
      adminName: newOrg.adminName,
      creatorId: currentUser?.id,
      creatorRole: currentUser?.role || 'admin'
    }).catch(e => console.error('[BACKEND CREATE PROJECT ERROR]', e));

    // Otomatis beralih ke project baru yang masih bersih dan kosong
    switchProject(newId);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: newId,
      organizationName: newOrg.name,
      actorName: currentUser ? currentUser.name : 'Pengguna',
      actorRole: currentUser ? currentUser.role : 'user',
      action: 'Membuat Project Baru',
      target: `${newOrg.name} (${newOrg.type})`,
      timestamp: 'Baru saja',
      type: 'organization'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: `Project "${newOrg.name}" berhasil dibuat dan siap digunakan!`,
      org: newOrg
    };
  };

  // Delete Organization - Frees the Admin to create a new organization
  const deleteOrganization = (orgId: string): { success: boolean; message: string } => {
    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      return { success: false, message: 'Proyek tidak ditemukan.' };
    }

    // Permission: Admin, Superadmin, or User
    const isOwner = currentUser?.organizationId === orgId || targetOrg.adminId === currentUser?.id;
    const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'user' || isOwner;

    if (!isAuthorized) {
      return { success: false, message: 'Anda tidak memiliki hak akses untuk menghapus proyek ini.' };
    }

    // 1. Remove org from organizations list
    setOrganizations(prev => prev.filter(o => o.id !== orgId));

    // Delete in MySQL Backend
    api.organizations.delete(orgId).catch(e => console.error('[BACKEND DELETE ORG ERROR]', e));

    // 2. Clear org reference from all users who belonged to this org
    setUsers(prev => prev.map(u => {
      if (u.organizationId === orgId) {
        return {
          ...u,
          organizationId: null,
          organizationName: null,
          orgJoinStatus: 'none'
        };
      }
      return u;
    }));

    // 3. Clear current user's org reference if they belonged to it, KEEPING their role intact
    if (currentUser?.organizationId === orgId) {
      const remainingOrgs = organizations.filter(o => o.id !== orgId);
      const nextOrg = remainingOrgs.length > 0 ? remainingOrgs[0] : null;
      const updatedUser: User = {
        ...currentUser,
        organizationId: nextOrg ? nextOrg.id : null,
        organizationName: nextOrg ? nextOrg.name : null,
        orgJoinStatus: nextOrg ? 'joined' : 'none'
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('kms_current_user', JSON.stringify(updatedUser));
    }

    // Reset activeProjectId if the deleted org was active
    if (activeProjectId === orgId) {
      const remainingOrgs = organizations.filter(o => o.id !== orgId);
      const nextId = remainingOrgs.length > 0 ? remainingOrgs[0].id : null;
      setActiveProjectId(nextId);
      if (nextId) {
        localStorage.setItem('kms_active_project_id', nextId);
      } else {
        localStorage.removeItem('kms_active_project_id');
      }
    }

    // 4. Remove documents and chunks tied to this org
    setDocuments(prev => prev.filter(d => d.organizationId !== orgId));
    setChunks(prev => prev.filter(c => c.organizationId !== orgId));

    // Refresh backend data
    setTimeout(() => {
      refreshBackendData();
    }, 600);

    // 5. Audit log
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: null,
      organizationName: null,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser ? currentUser.role : 'admin',
      action: 'Menghapus Organisasi / Project',
      target: targetOrg.name,
      timestamp: 'Baru saja',
      type: 'organization'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: `Project ${targetOrg.name} berhasil dihapus.`
    };
  };

  // Update Organization
  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    setOrganizations(prev => prev.map(org => org.id === id ? { ...org, ...updates } : org));
    if (currentUser && (activeProjectId === id || currentUser.organizationId === id) && updates.name) {
      setCurrentUser(prev => prev ? { ...prev, organizationName: updates.name || prev.organizationName } : null);
    }
    api.organizations.update(id, updates)
      .then(() => {
        refreshBackendData();
      })
      .catch(e => console.error('[BACKEND UPDATE ORG ERROR]', e));
  };

  // Toggle Organization Status
  const toggleOrgStatus = (id: string) => {
    setOrganizations(prev => prev.map(org => {
      if (org.id === id) {
        const nextStatus = org.status === 'active' ? 'inactive' : 'active';
        api.organizations.toggleStatus(id).catch(e => console.error('[BACKEND TOGGLE ORG ERROR]', e));
        return { ...org, status: nextStatus };
      }
      return org;
    }));
  };

  // Upload Document with Simulated Chunking & Embedding Pipeline
  const uploadDocument = async (docData: {
    title: string;
    category: DocumentItem['category'];
    year: number;
    fileType: 'PDF' | 'DOCX' | 'XLSX';
    fileSizeKb: number;
    department: string;
    tags: string[];
    summary: string;
    organizationId?: string;
  }, file?: File): Promise<DocumentItem> => {
    const targetOrgId = docData.organizationId || currentOrganization?.id || activeProjectId;
    const targetOrg = organizations.find(o => o.id === targetOrgId) || currentOrganization;
    if (!targetOrg) {
      throw new Error('Proyek tujuan tidak valid atau belum dipilih.');
    }
    const newDocId = `doc-${Date.now()}`;

    const generatedChunksCount = Math.floor(Math.random() * 4) + 4;

    const newDoc: DocumentItem = {
      id: newDocId,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      title: docData.title,
      category: docData.category,
      repositoryType: (docData as any).repositoryType || 'document',
      year: docData.year,
      fileType: docData.fileType,
      fileSizeKb: docData.fileSizeKb,
      uploadedBy: currentUser ? currentUser.name : 'Admin',
      uploadedById: currentUser?.id,
      uploaderRole: currentUser?.role || 'user',
      uploadedAt: new Date().toISOString().split('T')[0],
      version: 'v1.0',
      status: 'indexed',
      chunksCount: generatedChunksCount,
      summary: docData.summary,
      department: docData.department,
      tags: docData.tags
    };

    const newChunksList: KnowledgeChunk[] = [
      {
        id: `chunk-${newDocId}-1`,
        documentId: newDocId,
        documentTitle: docData.title,
        organizationId: targetOrg.id,
        organizationName: targetOrg.name,
        chunkIndex: 1,
        totalChunks: generatedChunksCount,
        sectionTitle: 'Bagian I: Ringkasan Eksekutif & Latar Belakang',
        content: `${docData.summary}. Dokumen ini diterbitkan secara sah untuk lingkungan internal ${targetOrg.name} guna menunjang standardisasi operasional tahun ${docData.year}.`,
        tokenCount: 95,
        embeddingStatus: 'embedded'
      },
      {
        id: `chunk-${newDocId}-2`,
        documentId: newDocId,
        documentTitle: docData.title,
        organizationId: targetOrg.id,
        organizationName: targetOrg.name,
        chunkIndex: 2,
        totalChunks: generatedChunksCount,
        sectionTitle: 'Bagian II: Ketentuan Prosedural & Langkah Operasional',
        content: `Setiap divisi di ${targetOrg.name} khususnya ${docData.department} wajib mematuhi matriks kepatuhan yang tercantum pada klausul operasional ini. Segala bentuk pelanggaran standar dikenakan peninjauan berkala oleh tim audit internal.`,
        tokenCount: 88,
        embeddingStatus: 'embedded'
      }
    ];

    // Persist document to MySQL Backend with optional actual file
    const fd = new FormData();
    fd.append('id', newDocId);
    fd.append('title', docData.title);
    fd.append('category', docData.category);
    fd.append('repositoryType', (docData as any).repositoryType || 'document');
    fd.append('year', String(docData.year));
    fd.append('organizationId', targetOrg ? targetOrg.id : (targetOrgId || ''));
    if (targetOrg?.code) {
      fd.append('projectCode', targetOrg.code);
    }
    if (targetOrg?.name) {
      fd.append('projectName', targetOrg.name);
    }
    fd.append('notes', docData.summary);
    fd.append('uploadedBy', currentUser ? currentUser.name : 'Admin');
    fd.append('uploadedById', currentUser ? currentUser.id : '');
    fd.append('uploaderRole', currentUser?.role || 'user');
    if (file) {
      fd.append('file', file);
    }

    try {
      const res = await api.documents.upload(fd);
      if (res.success && res.document) {
        if (res.document.fileUrl) {
          newDoc.fileUrl = res.document.fileUrl;
        }
        if (res.document.id) {
          newDoc.id = res.document.id;
        }
        if (res.document.organizationId) {
          newDoc.organizationId = res.document.organizationId;
        }
      }
    } catch (e: any) {
      console.error('[BACKEND UPLOAD DOC ERROR]', e);
      // Surface the failure to the caller without the word "organisasi"
      const rawErrMsg = e?.message || 'Gagal menyimpan dokumen ke server. Silakan coba lagi.';
      const cleanErrMsg = rawErrMsg.replace(/organisasi/gi, 'proyek');
      throw new Error(cleanErrMsg);
    }

    setDocuments(prev => [newDoc, ...prev]);
    setChunks(prev => [...newChunksList, ...prev]);

    setOrganizations(prev => prev.map(o => {
      if (o.id === targetOrg.id) {
        return {
          ...o,
          documentsCount: o.documentsCount + 1,
          chunksCount: o.chunksCount + generatedChunksCount,
          storageUsedMb: o.storageUsedMb + Math.round(docData.fileSizeKb / 1024)
        };
      }
      return o;
    }));

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser?.role || 'admin',
      action: 'Unggah Dokumen Baru',
      target: `${docData.title} (${Math.round(docData.fileSizeKb / 1024 * 10) / 10} MB)`,
      timestamp: 'Baru saja',
      type: 'document'
    };
    setActivityLogs(prev => [log, ...prev]);

    return newDoc;
  };

  // Delete Document
  const deleteDocument = (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    setDocuments(prev => prev.filter(d => d.id !== id));
    setChunks(prev => prev.filter(c => c.documentId !== id));

    // Delete in MySQL Backend
    api.documents.delete(id).catch(e => console.error('[BACKEND DELETE DOC ERROR]', e));

    setOrganizations(prev => prev.map(o => {
      if (o.id === docToDelete.organizationId) {
        return {
          ...o,
          documentsCount: Math.max(0, o.documentsCount - 1),
          chunksCount: Math.max(0, o.chunksCount - docToDelete.chunksCount)
        };
      }
      return o;
    }));

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: docToDelete.organizationId,
      organizationName: docToDelete.organizationName,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser?.role || 'admin',
      action: 'Menghapus Dokumen',
      target: docToDelete.title,
      timestamp: 'Baru saja',
      type: 'document'
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  // Update Document
  const updateDocument = async (id: string, updates: Partial<DocumentItem>): Promise<boolean> => {
    try {
      const res = await api.documents.update(id, updates);
      if (res && res.success) {
        setDocuments(prev => prev.map(doc => {
          if (doc.id === id) {
            return {
              ...doc,
              ...updates,
              ...(res.document || {})
            };
          }
          return doc;
        }));

        const targetDoc = documents.find(d => d.id === id);
        const log: ActivityLog = {
          id: `act-${Date.now()}`,
          organizationId: targetDoc?.organizationId || null,
          organizationName: targetDoc?.organizationName || 'KMS BUMD',
          actorName: currentUser ? currentUser.name : 'Pengguna',
          actorRole: currentUser?.role || 'user',
          action: 'Memperbarui Metadata Dokumen',
          target: updates.title || targetDoc?.title || id,
          timestamp: 'Baru saja',
          type: 'document'
        };
        setActivityLogs(prev => [log, ...prev]);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[UPDATE DOCUMENT ERROR]', err);
      throw err;
    }
  };

  // Add User
  const addUser = (userData: Omit<User, 'id' | 'joinedAt' | 'avatarInitials'>) => {
    // Only superadmin can assign 'admin' or 'superadmin' roles; admins can only add regular users
    const effectiveRole: UserRole = (currentUser?.role === 'superadmin')
      ? userData.role
      : 'user';

    const initials = userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const newUser: User = {
      ...userData,
      role: effectiveRole,
      id: `user-${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
      avatarInitials: initials || 'US',
      orgJoinStatus: 'joined'
    };

    setUsers(prev => [...prev, newUser]);
    if (userData.organizationId) {
      setOrganizations(prev => prev.map(o => o.id === userData.organizationId ? { ...o, usersCount: o.usersCount + 1 } : o));
    }

    // Persist to MySQL Backend
    api.users.create({
      name: userData.name,
      email: userData.email,
      organizationId: userData.organizationId,
      role: effectiveRole
    }).catch(e => console.error('[BACKEND ADD USER ERROR]', e));
  };

  // Edit User (Update name, email, department, avatarUrl)
  const editUser = (userId: string, data: Partial<User>) => {
    const initials = data.name ? data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : undefined;

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          ...data,
          avatarInitials: initials || u.avatarInitials,
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : u.avatarUrl
        };
      }
      return u;
    }));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        ...data,
        avatarInitials: initials || prev.avatarInitials,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : prev.avatarUrl
      }) : null);
    }

    // Persist to MySQL Backend
    api.users.update(userId, data).catch(e => console.error('[BACKEND UPDATE USER ERROR]', e));

    const targetUser = users.find(u => u.id === userId);
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetUser?.organizationId || null,
      organizationName: targetUser?.organizationName || null,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser?.role || 'admin',
      action: 'Memperbarui Data Anggota',
      target: data.name || targetUser?.name || 'Anggota',
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Remove User From Organization (Eject member)
  const removeUserFromOrg = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const orgId = targetUser.organizationId;
    const orgName = targetUser.organizationName || organizations.find(o => o.id === orgId)?.name || 'Organisasi';

    if (!orgId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      api.users.eject(userId).catch(e => console.error('[BACKEND EJECT USER ERROR]', e));
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          organizationId: null,
          organizationName: null,
          orgJoinStatus: 'none'
        };
      }
      return u;
    }));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser({
        ...currentUser,
        organizationId: null,
        organizationName: null,
        orgJoinStatus: 'none'
      });
    }

    // Persist to MySQL Backend
    api.users.eject(userId).catch(e => console.error('[BACKEND EJECT USER ERROR]', e));

    setOrganizations(prev => prev.map(o => {
      if (o.id === orgId) {
        return { ...o, usersCount: Math.max(0, o.usersCount - 1) };
      }
      return o;
    }));

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: orgId,
      organizationName: orgName,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser?.role || 'admin',
      action: 'Mengeluarkan Anggota dari Organisasi',
      target: targetUser.name,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Update User Role (Superadmin promotes User to Admin or demotes Admin to User)
  const updateUserRole = (userId: string, newRole: UserRole) => {
    // Permission check: only superadmin can promote or demote admin roles
    if (currentUser?.role !== 'superadmin') {
      console.warn('Wewenang ditolak: Hanya Superadmin yang berhak mengubah role User/Admin.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Preserving organization - changing role should NEVER kick user out of their organization
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole
        };
      }
      return u;
    }));

    // Persist to MySQL Backend
    if (newRole === 'admin' || newRole === 'user') {
      api.users.updateRole(userId, newRole).catch(e => console.error('[BACKEND UPDATE ROLE ERROR]', e));
    }

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        role: newRole
      } : null);
    }

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetUser?.organizationId || null,
      organizationName: targetUser?.organizationName || null,
      actorName: currentUser ? currentUser.name : 'Superadmin',
      actorRole: 'superadmin',
      action: newRole === 'admin'
        ? 'Promosi Menjadi Admin Organisasi'
        : 'Penyesuaian Hak Akses Menjadi Anggota / User',
      target: targetUser ? targetUser.name : userId,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  // Set user account status (suspend / re-activate) - admin & superadmin only
  const setUserStatus = (userId: string, status: 'active' | 'inactive') => {
    if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin') {
      console.warn('Wewenang ditolak: Hanya Admin/Superadmin yang dapat mengubah status akun.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Safety guards: never suspend own account or a superadmin account
    if (targetUser.id === currentUser.id || targetUser.role === 'superadmin') return;
    if (currentUser.role === 'admin' && targetUser.organizationId !== currentUser.organizationId) return;

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status } : u)));

    // Persist to MySQL Backend
    api.users.setStatus(userId, status).catch(e => console.error('[BACKEND SET STATUS ERROR]', e));

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetUser.organizationId || null,
      organizationName: targetUser.organizationName || null,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: status === 'inactive' ? 'Menonaktifkan Akun Anggota' : 'Mengaktifkan Kembali Akun Anggota',
      target: targetUser.name,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Reset a member's password (admin sets a new temporary password)
  const resetUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin') return false;

    const targetUser = users.find(u => u.id === userId);

    try {
      await api.users.resetPassword(userId, newPassword);

      if (targetUser) {
        const newLog: ActivityLog = {
          id: `act-${Date.now()}`,
          organizationId: targetUser.organizationId || null,
          organizationName: targetUser.organizationName || null,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: 'Reset Kata Sandi Anggota',
          target: targetUser.name,
          timestamp: 'Baru saja',
          type: 'user'
        };
        setActivityLogs(prev => [newLog, ...prev]);
      }
      return true;
    } catch (e: any) {
      console.error('[RESET USER PASSWORD ERROR]', e);
      throw new Error(e?.message || 'Gagal mereset kata sandi pengguna.');
    }
  };

  // Delete a user account permanently (admin & superadmin only)
  const deleteUser = (userId: string) => {
    if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin') {
      console.warn('Wewenang ditolak: Hanya Admin/Superadmin yang dapat menghapus akun.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Safety guards: never delete own account or a superadmin account
    if (targetUser.id === currentUser.id || targetUser.role === 'superadmin') return;
    if (currentUser.role === 'admin' && targetUser.organizationId !== currentUser.organizationId) return;

    // Optimistic UI update, then persist to MySQL backend
    setUsers(prev => prev.filter(u => u.id !== userId));

    if (targetUser.organizationId) {
      setOrganizations(prev => prev.map(o =>
        o.id === targetUser.organizationId
          ? { ...o, usersCount: Math.max(0, o.usersCount - 1) }
          : o
      ));
    }

    api.users.delete(userId).catch(e => console.error('[BACKEND DELETE USER ERROR]', e));

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetUser.organizationId || null,
      organizationName: targetUser.organizationName || null,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'Menghapus Akun Anggota',
      target: targetUser.name,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Approve Join Request
  const approveJoinRequest = (requestId: string) => {
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;

    // Optimistic UI update, then persist to MySQL backend
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' as const } : r));

    const targetOrg = organizations.find(
      o => o.id === req.organizationId || o.code === req.organizationCode || o.name.toLowerCase().includes(req.organizationName.toLowerCase())
    ) || organizations[0];

    if (req.userId) {
      setUsers(prev => prev.map(u => u.id === req.userId
        ? { ...u, organizationId: targetOrg.id, organizationName: targetOrg.name, orgJoinStatus: 'joined' as const }
        : u
      ));
      if (currentUser && currentUser.id === req.userId) {
        setCurrentUser({ ...currentUser, organizationId: targetOrg.id, organizationName: targetOrg.name, orgJoinStatus: 'joined' });
      }
    } else {
      // Legacy request without user account: create a local user record
      const initials = req.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const newUser: User = {
        id: `user-approved-${Date.now()}`,
        name: req.applicantName,
        email: req.applicantEmail,
        role: 'user',
        organizationId: targetOrg.id,
        organizationName: targetOrg.name,
        department: req.department,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        avatarInitials: initials,
        orgJoinStatus: 'joined'
      };
      setUsers(prev => [...prev, newUser]);
    }

    setOrganizations(prev => prev.map(o => o.id === targetOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o));

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser?.role || 'admin',
      action: 'Menyetujui Permintaan Bergabung',
      target: `${req.applicantName} (${req.department})`,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [log, ...prev]);

    api.membership.approve(requestId).catch(e => console.error('[BACKEND APPROVE REQUEST ERROR]', e));
  };

  // Reject Join Request
  const rejectJoinRequest = (requestId: string) => {
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r));
    api.membership.reject(requestId).catch(e => console.error('[BACKEND REJECT REQUEST ERROR]', e));
  };

  // Submit Join Request from Public Screen
  const submitJoinRequest = (orgCode: string, name: string, email: string, dept: string, reason: string) => {
    const org = organizations.find(o => o.code.toLowerCase() === orgCode.trim().toLowerCase());
    if (!org) {
      return { success: false, message: 'Kode organisasi tidak ditemukan dalam database KMS.' };
    }

    const newReq: JoinRequest = {
      id: `req-${Date.now()}`,
      organizationId: org.id,
      organizationCode: org.code,
      organizationName: org.name,
      userId: currentUser?.id || null,
      applicantName: name,
      applicantEmail: email,
      department: dept,
      reason: reason,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    setJoinRequests(prev => [newReq, ...prev]);

    // Persist to backend (userId may be null for public submissions)
    if (currentUser?.id) {
      api.membership.join(currentUser.id, org.id, reason, dept)
        .then(res => {
          if (res.success && res.requestId) {
            setJoinRequests(prev => prev.map(r => r.id === newReq.id ? { ...r, id: res.requestId! } : r));
          }
        })
        .catch(e => console.error('[BACKEND SUBMIT REQUEST ERROR]', e));
    }

    return { success: true, message: `Permintaan bergabung ke ${org.name} berhasil diajukan. Status saat ini: Pending approval oleh Admin.` };
  };

  // Update RAG Config
  const updateRagConfig = (newConfig: Partial<RagConfig>) => {
    setRagConfig(prev => ({ ...prev, ...newConfig }));
  };

  function cleanRagResponseText(text: string): string {
    if (!text) return '';
    let cleaned = text;
    const tokenDict: Record<string, string> = {
      '其余': 'lainnya',
      '提交': 'menyampaikan',
      '多位': 'beragam',
      'وعة': '',
      'Diesel多位kan': 'Dioptimalkan',
      '多位kan': 'kan',
    };
    for (const [k, v] of Object.entries(tokenDict)) {
      cleaned = cleaned.split(k).join(v);
    }
    cleaned = cleaned.replace(/[\u4e00-\u9fff\u0600-\u06ff]/g, '');
    cleaned = cleaned.replace(/chunk\s*\d+\s*\(p?(\d+)\)/gi, 'Halaman $1');
    cleaned = cleaned.replace(/chunk\s*0*(\d+)/gi, 'Bagian $1');
    cleaned = cleaned.replace(/chunkOTHER/gi, 'bagian lainnya');
    cleaned = cleaned.replace(/\bchunk\b/gi, 'bagian dokumen');
    cleaned = cleaned.replace(/\bchunks\b/gi, 'bagian dokumen');
    cleaned = cleaned.replace(/\b(?:di|pada)\s+context\b/gi, 'dalam dokumen');
    cleaned = cleaned.replace(/\bcontext\b/gi, 'dokumen');
    cleaned = cleaned.replace(/Halaman\s*lainnya\s*tidak ada (?:di\s*)?dalam dokumen/gi, 'Halaman lainnya tidak memuat rincian tersebut.');
    // Untrap URLs in backticks so they render as interactive links
    cleaned = cleaned.replace(/`\s*(https?:\/\/[^\s`]+)\s*`/gi, '[$1]($1)');
    cleaned = cleaned.replace(/\[\s+/g, '[');
    cleaned = cleaned.replace(/\s+\]\(/g, '](');
    return cleaned.trim();
  }

  // Send Chat Message with Context-Aware RAG Retrieval
  const sendChatMessage = async (question: string, overrideOrgId?: string) => {
    const targetOrgId = overrideOrgId || currentOrganization?.id || (currentUser?.role !== 'superadmin' ? currentUser?.organizationId : null);
    const orgIdKey = targetOrgId || 'global';

    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: question,
      timestamp: 'Baru saja',
      organizationId: orgIdKey
    };

    setChatMessages(prev => [...prev, userMsg]);

    const startTime = performance.now();

    let answerText = '';
    let citations: CitationReference[] = [];
    let isGrounded = false;
    let modelName = 'space-bunny-free';
    let attachments: MessageAttachment[] = [];

    try {
      // 1. Call real RAG backend service
      const ragResponse = await api.chat.query({
        query: question,
        organizationId: targetOrgId
      });

      if (ragResponse.success && ragResponse.answer) {
        answerText = cleanRagResponseText(ragResponse.answer);
        isGrounded = ragResponse.grounded;
        modelName = ragResponse.model || 'space-bunny-free';

        if (Array.isArray(ragResponse.sources)) {
          citations = ragResponse.sources.map((s, idx) => ({
            chunkId: s.chunk_id || `chunk-${idx}`,
            documentTitle: s.document_name,
            page: s.page || 1,
            similarityScore: s.score || 0.95,
            snippet: s.section || s.document_name,
            documentId: s.document_id
          }));
        }

        // Lampiran multi-dokumen (foto/file/dokumen via Kroombox CDN) untuk dirender di bubble chat
        if (Array.isArray(ragResponse.attachments) && ragResponse.attachments.length > 0) {
          attachments = ragResponse.attachments;
        }
      } else {
        throw new Error(ragResponse.error || 'RAG query returned empty');
      }
    } catch (ragError: any) {
      console.warn('[RAG CHAT ERROR]', ragError);
      answerText = `Mohon maaf, layanan AI saat ini sedang tidak dapat memproses jawaban (${ragError?.message || 'Kendala koneksi'}). Silakan coba beberapa saat lagi.`;
    }

    const latencyMs = Math.round(performance.now() - startTime);

    const assistantMsg: ChatMessage = {
      id: `msg-a-${Date.now()}`,
      sender: 'assistant',
      text: answerText,
      timestamp: 'Baru saja',
      organizationId: orgIdKey,
      sources: citations,
      citations: citations,
      grounded: isGrounded,
      model: modelName,
      retrievalLatencyMs: latencyMs,
      responseTimeMs: latencyMs,
      attachments
    };

    setChatMessages(prev => [...prev, assistantMsg]);

    if (targetOrgId) {
      setOrganizations(prev => prev.map(o => o.id === targetOrgId ? { ...o, aiQueriesCount: o.aiQueriesCount + 1 } : o));
    }

    const targetOrg = organizations.find(o => o.id === targetOrgId);
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: targetOrgId || null,
      organizationName: targetOrg?.name || currentUser?.organizationName || null,
      actorName: currentUser ? currentUser.name : 'Pengguna',
      actorRole: currentUser?.role || 'user',
      action: 'Pertanyaan RAG AI',
      target: `"${question.slice(0, 45)}..."`,
      timestamp: 'Baru saja',
      type: 'ai'
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  const clearChatHistory = (targetOrgId?: string) => {
    const orgIdKey = targetOrgId || currentOrganization?.id || (currentUser?.role !== 'superadmin' ? currentUser?.organizationId : null) || 'global';
    const targetOrg = organizations.find(o => o.id === orgIdKey);
    const orgName = targetOrg?.name || 'organisasi ini';

    setChatMessages(prev => [
      ...prev.filter(m => m.organizationId !== orgIdKey && m.organizationId !== 'all'),
      {
        id: `msg-init-${Date.now()}`,
        sender: 'assistant',
        text: `Riwayat percakapan untuk ${orgName} telah dibersihkan. Silakan ajukan pertanyaan baru seputar dokumen dan SOP resmi.`,
        timestamp: 'Baru saja',
        organizationId: orgIdKey
      }
    ]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    localStorage.setItem('kms_logs_store', JSON.stringify([]));
    api.activities.clear(currentUser?.role === 'superadmin' ? undefined : (currentUser?.organizationId || undefined))
      .catch(e => console.error('[BACKEND CLEAR LOGS ERROR]', e));
  };

  const deleteActivityLog = (id: string) => {
    setActivityLogs(prev => prev.filter(log => log.id !== id));
    api.activities.delete(id).catch(e => console.error('[BACKEND DELETE LOG ERROR]', e));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      organizations,
      users,
      documents,
      chunks,
      activityLogs,
      clearActivityLogs,
      deleteActivityLog,
      joinRequests,
      ragConfig,
      chatMessages,
      currentOrganization,
      currentProject,
      projects,
      activeProjectId,
      switchProject,
      accessibleDocuments,
      accessibleChunks,
      login,
      superadminLogin,
      registerUser,
      logout,
      joinOrganization,
      leaveOrganization,
      joinOrganizationForCurrentUser,
      addOrganization,
      deleteOrganization,
      updateOrganization,
      toggleOrgStatus,
      uploadDocument,
      deleteDocument,
      updateDocument,
      approveJoinRequest,
      rejectJoinRequest,
      submitJoinRequest,
      updateRagConfig,
      sendChatMessage,
      clearChatHistory,
      addUser,
      editUser,
      removeUserFromOrg,
      updateUserRole,
      setUserStatus,
      resetUserPassword,
      deleteUser,
      refreshBackendData,
      mobileMenuOpen,
      setMobileMenuOpen,
      selectedDocForViewer,
      setSelectedDocForViewer,
      selectedChunkForInspector,
      setSelectedChunkForInspector,
      theme,
      toggleTheme,
      setTheme,
      sidebarCollapsed,
      toggleSidebarCollapsed,
      setSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
