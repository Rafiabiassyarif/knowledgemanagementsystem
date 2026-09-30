import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
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
import { api } from '../services/api';

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
  accessibleDocuments: DocumentItem[];
  accessibleChunks: KnowledgeChunk[];
  
  // Auth & Registration actions
  login: (email: string, password: string) => { success: boolean; message?: string; user?: User };
  superadminLogin: (email: string, password: string) => { success: boolean; message?: string; user?: User };
  registerUser: (data: { 
    name: string; 
    email: string; 
    password: string; 
    department: string; 
    phone?: string; 
    employeeId?: string; 
    orgCode?: string 
  }) => { success: boolean; message: string; user?: User; requiresOrgJoin: boolean };
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
  }) => Promise<DocumentItem>;
  deleteDocument: (id: string) => void;
  approveJoinRequest: (requestId: string) => void;
  rejectJoinRequest: (requestId: string) => void;
  submitJoinRequest: (orgCode: string, name: string, email: string, dept: string, reason: string) => { success: boolean; message: string };
  updateRagConfig: (newConfig: Partial<RagConfig>) => void;
  sendChatMessage: (question: string) => Promise<void>;
  clearChatHistory: () => void;
  addUser: (userData: Omit<User, 'id' | 'joinedAt' | 'avatarInitials'>) => void;
  editUser: (userId: string, data: Partial<User>) => void;
  removeUserFromOrg: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
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
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialUsers;
  });

  // Default initial active user: null (requires login/register)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kms_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('kms_orgs_store');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialOrganizations;
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [chunks, setChunks] = useState<KnowledgeChunk[]>(initialKnowledgeChunks);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('kms_logs_store');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
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

  // Load and synchronize with MySQL backend on startup
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [orgRes, usersRes, docsRes, logsRes] = await Promise.allSettled([
          api.organizations.getAll(),
          api.users.getAll(),
          api.documents.getAll(),
          api.activities.getAll()
        ]);

        if (orgRes.status === 'fulfilled' && orgRes.value.success && orgRes.value.organizations.length > 0) {
          setOrganizations(orgRes.value.organizations);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.success && usersRes.value.users.length > 0) {
          setUsers(usersRes.value.users);
        }
        if (docsRes.status === 'fulfilled' && docsRes.value.success && docsRes.value.documents.length > 0) {
          setDocuments(docsRes.value.documents);
        }
        if (logsRes.status === 'fulfilled' && logsRes.value.success && logsRes.value.logs.length > 0) {
          setActivityLogs(logsRes.value.logs);
        }
      } catch (err) {
        console.warn('[BACKEND SYNC INFO] Using local storage state:', err);
      }
    }
    loadBackendData();
  }, []);

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

  // Current Organization helper
  const currentOrganization = useMemo(() => {
    if (!currentUser || !currentUser.organizationId) return null;
    return organizations.find(o => o.id === currentUser.organizationId) || null;
  }, [currentUser, organizations]);

  // Accessible documents based on role
  const accessibleDocuments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'superadmin') {
      return documents;
    }
    return documents.filter(doc => doc.organizationId === currentUser.organizationId);
  }, [currentUser, documents]);

  // Accessible chunks based on role
  const accessibleChunks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'superadmin') {
      return chunks;
    }
    return chunks.filter(c => c.organizationId === currentUser.organizationId);
  }, [currentUser, chunks]);

  // General login for all roles (Superadmin, Admin, User)
  const login = (email: string, password: string): { success: boolean; message?: string; user?: User } => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Direct convenient account mappings
    let targetEmail = cleanEmail;
    if (cleanEmail === 'superadmin@kms.id' || cleanEmail === 'superadmin') {
      targetEmail = 'rafi.superadmin@kms.gov.id';
    } else if (cleanEmail === 'admin@kms.id' || cleanEmail === 'admin.pam@kms.id' || cleanEmail === 'admin') {
      targetEmail = 'andi.pratama@pamjaya.co.id';
    } else if (cleanEmail === 'user@kms.id' || cleanEmail === 'budi@pamjaya.co.id' || cleanEmail === 'user') {
      targetEmail = 'budi.santoso@pamjaya.co.id';
    }

    const foundUser = users.find(u => u.email.toLowerCase() === targetEmail);

    if (!foundUser) {
      return { success: false, message: 'Alamat email belum terdaftar dalam sistem KMS. Silakan registrasi terlebih dahulu.' };
    }

    setCurrentUser(foundUser);

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: foundUser.organizationId,
      organizationName: foundUser.organizationName,
      actorName: foundUser.name,
      actorRole: foundUser.role,
      action: 'Masuk ke Platform KMS',
      target: foundUser.role === 'superadmin' ? 'Portal Superadmin' : 'Sesi Web User',
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [log, ...prev]);

    return { success: true, user: foundUser };
  };

  // Dedicated Superadmin Login
  const superadminLogin = (email: string, password: string): { success: boolean; message?: string; user?: User } => {
    const cleanEmail = email.trim().toLowerCase();
    const superadminUser = users.find(u => u.role === 'superadmin' && u.email.toLowerCase() === cleanEmail);

    if (!superadminUser) {
      // Allow demo superadmin credentials
      if (cleanEmail === 'rafi.superadmin@kms.gov.id' || cleanEmail === 'superadmin@kms.id' || cleanEmail === 'admin@kms.gov.id') {
        const defaultSuper = users.find(u => u.role === 'superadmin') || initialUsers[0];
        setCurrentUser(defaultSuper);
        return { success: true, user: defaultSuper };
      }
      return { success: false, message: 'Kredensial Superadmin tidak valid atau akun tidak memiliki hak akses platform governance.' };
    }

    setCurrentUser(superadminUser);
    return { success: true, user: superadminUser };
  };

  // Register New User
  const registerUser = (data: { 
    name: string; 
    email: string; 
    password: string; 
    department: string; 
    phone?: string; 
    employeeId?: string; 
    orgCode?: string 
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.', requiresOrgJoin: false };
    }

    const initials = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
    const newId = `user-reg-${Date.now()}`;

    let matchedOrg: Organization | null = null;
    let orgStatus: 'joined' | 'pending' | 'none' = 'none';

    if (data.orgCode) {
      const cleanInput = data.orgCode.trim().toLowerCase();
      const foundOrg = organizations.find(o => o.code.toLowerCase() === cleanInput || o.id.toLowerCase() === cleanInput);
      if (foundOrg) {
        matchedOrg = foundOrg;
        orgStatus = 'joined';
      }
    }

    const newUser: User = {
      id: newId,
      name: data.name,
      email: cleanEmail,
      role: 'user',
      organizationId: matchedOrg ? matchedOrg.id : null,
      organizationName: matchedOrg ? matchedOrg.name : null,
      department: data.department || 'Umum',
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      avatarInitials: initials,
      phone: data.phone,
      employeeId: data.employeeId,
      orgJoinStatus: orgStatus
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);

    if (matchedOrg) {
      setOrganizations(prev => prev.map(o => o.id === matchedOrg!.id ? { ...o, usersCount: o.usersCount + 1 } : o));
    }

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: matchedOrg ? matchedOrg.id : null,
      organizationName: matchedOrg ? matchedOrg.name : null,
      actorName: data.name,
      actorRole: 'user',
      action: 'Registrasi Akun Baru',
      target: matchedOrg ? `Bergabung ke ${matchedOrg.name}` : 'Menunggu Gabung Organisasi',
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [log, ...prev]);

    return { 
      success: true, 
      message: 'Registrasi berhasil!', 
      user: newUser,
      requiresOrgJoin: !matchedOrg 
    };
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kms_current_user');
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

  // Add Organization - Enforces strictly 1 Organization per Admin
  const addOrganization = (newOrgData: Omit<Organization, 'id' | 'documentsCount' | 'usersCount' | 'chunksCount' | 'aiQueriesCount' | 'storageUsedMb' | 'createdAt'>): { success: boolean; message: string; org?: Organization } => {
    // Check role authorization
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return { 
        success: false, 
        message: 'Hak akses ditolak. Hanya akun Admin atau Superadmin yang diizinkan mendaftarkan organisasi.' 
      };
    }

    // Strictly enforce 1 organization per admin
    if (currentUser?.role === 'admin' && currentUser.organizationId) {
      return { 
        success: false, 
        message: 'Admin hanya dapat memiliki dan mengelola 1 organisasi. Anda harus menghapus organisasi yang aktif terlebih dahulu jika ingin membuat organisasi baru.' 
      };
    }

    // Check unique code
    const existingWithCode = organizations.find(o => o.code.toLowerCase() === newOrgData.code.trim().toLowerCase());
    if (existingWithCode) {
      return {
        success: false,
        message: `Kode organisasi "${newOrgData.code}" sudah digunakan oleh ${existingWithCode.name}. Silakan gunakan kode unik lain.`
      };
    }

    const newId = `org-${newOrgData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newOrg: Organization = {
      ...newOrgData,
      id: newId,
      documentsCount: 0,
      usersCount: 1,
      chunksCount: 0,
      aiQueriesCount: 0,
      storageUsedMb: 120,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // If current logged-in user is an admin, assign this 1 organization to them
    if (currentUser && currentUser.role === 'admin') {
      newOrg.adminId = currentUser.id;
      newOrg.adminName = currentUser.name;
      newOrg.adminEmail = currentUser.email;

      const updatedCurrentAdmin: User = {
        ...currentUser,
        organizationId: newId,
        organizationName: newOrg.name,
        orgJoinStatus: 'joined'
      };
      setCurrentUser(updatedCurrentAdmin);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedCurrentAdmin : u));
    } else {
      // Superadmin creating org with a designated admin
      const adminName = newOrgData.adminName || 'Admin ' + newOrgData.name;
      const adminEmail = newOrgData.adminEmail || `admin@${newOrgData.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`;
      const initials = adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const newAdminUser: User = {
        id: `user-admin-${Date.now()}`,
        name: adminName,
        email: adminEmail,
        role: 'admin',
        organizationId: newId,
        organizationName: newOrg.name,
        department: 'Manajemen Pengetahuan Organisasi',
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        avatarInitials: initials || 'AD',
        orgJoinStatus: 'joined'
      };
      setUsers(prev => [...prev, newAdminUser]);
    }

    setOrganizations(prev => [newOrg, ...prev]);

    // Persist to MySQL Backend
    api.organizations.create({
      ...newOrgData,
      adminName: newOrg.adminName,
      creatorId: currentUser?.id,
      creatorRole: currentUser?.role
    }).catch(e => console.error('[BACKEND CREATE ORG ERROR]', e));

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: newId,
      organizationName: newOrg.name,
      actorName: currentUser ? currentUser.name : 'Superadmin',
      actorRole: currentUser ? currentUser.role : 'superadmin',
      action: 'Membuat Organisasi Baru (Kebijakan 1 Admin = 1 Org)',
      target: `${newOrg.name} (${newOrg.type})`,
      timestamp: 'Baru saja',
      type: 'organization'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: `Organisasi ${newOrg.name} berhasil dibuat!`,
      org: newOrg
    };
  };

  // Delete Organization - Frees the Admin to create a new organization
  const deleteOrganization = (orgId: string): { success: boolean; message: string } => {
    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      return { success: false, message: 'Organisasi tidak ditemukan.' };
    }

    // Permission: Superadmin OR the Admin owning this org
    const isOwnerAdmin = currentUser?.role === 'admin' && (currentUser.organizationId === orgId || targetOrg.adminId === currentUser.id);
    const isSuperadmin = currentUser?.role === 'superadmin';

    if (!isSuperadmin && !isOwnerAdmin) {
      return { success: false, message: 'Anda tidak memiliki hak akses untuk menghapus organisasi ini.' };
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
      const updatedUser: User = {
        ...currentUser,
        organizationId: null,
        organizationName: null,
        orgJoinStatus: 'none'
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('kms_current_user', JSON.stringify(updatedUser));
    }

    // 4. Remove documents and chunks tied to this org
    setDocuments(prev => prev.filter(d => d.organizationId !== orgId));
    setChunks(prev => prev.filter(c => c.organizationId !== orgId));

    // 5. Audit log
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: null,
      organizationName: null,
      actorName: currentUser ? currentUser.name : 'Admin',
      actorRole: currentUser ? currentUser.role : 'admin',
      action: 'Menghapus Organisasi (Reset Kuota 1 Organisasi)',
      target: targetOrg.name,
      timestamp: 'Baru saja',
      type: 'organization'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: `Organisasi ${targetOrg.name} berhasil dihapus. Kuota organisasi telah direset, Anda kini dapat membuat 1 organisasi baru.`
    };
  };

  // Update Organization
  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    setOrganizations(prev => prev.map(org => org.id === id ? { ...org, ...updates } : org));
    api.organizations.update(id, updates).catch(e => console.error('[BACKEND UPDATE ORG ERROR]', e));
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
  }): Promise<DocumentItem> => {
    const targetOrgId = docData.organizationId || currentUser?.organizationId || 'org-pam-jaya';
    const targetOrg = organizations.find(o => o.id === targetOrgId) || organizations[0];
    const newDocId = `doc-${Date.now()}`;

    const generatedChunksCount = Math.floor(Math.random() * 4) + 4;

    const newDoc: DocumentItem = {
      id: newDocId,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      title: docData.title,
      category: docData.category,
      year: docData.year,
      fileType: docData.fileType,
      fileSizeKb: docData.fileSizeKb,
      uploadedBy: currentUser ? currentUser.name : 'Admin',
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

    setDocuments(prev => [newDoc, ...prev]);
    setChunks(prev => [...newChunksList, ...prev]);

    // Persist document to MySQL Backend
    const fd = new FormData();
    fd.append('title', docData.title);
    fd.append('category', docData.category);
    fd.append('year', String(docData.year));
    fd.append('organizationId', targetOrg.id);
    fd.append('notes', docData.summary);
    fd.append('uploadedBy', currentUser ? currentUser.name : 'Admin');
    fd.append('uploadedById', currentUser ? currentUser.id : '');
    api.documents.upload(fd).catch(e => console.error('[BACKEND UPLOAD DOC ERROR]', e));

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
      action: 'Unggah & Ekstraksi Dokumen',
      target: `${docData.title} (${generatedChunksCount} chunks diindeks)`,
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
    if (!targetUser || !targetUser.organizationId) return;

    const orgId = targetUser.organizationId;
    const orgName = targetUser.organizationName;

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

    // If user is promoted to admin, and was only a regular member of someone else's org,
    // detach them so they have a fresh slot to create their own 1 organization!
    let resetOrg = false;
    if (newRole === 'admin' && targetUser.organizationId) {
      const existingOrg = organizations.find(o => o.id === targetUser.organizationId);
      if (existingOrg && existingOrg.adminId !== targetUser.id) {
        resetOrg = true;
      }
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          ...(resetOrg ? { organizationId: null, organizationName: null, orgJoinStatus: 'none' as const } : {})
        };
      }
      return u;
    }));

    // Persist to MySQL Backend
    if (newRole === 'admin' || newRole === 'user') {
      api.users.updateRole(userId, newRole).catch(e => console.error('[BACKEND UPDATE ROLE ERROR]', e));
    }

    if (currentUser && currentUser.id === userId) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        ...(resetOrg ? { organizationId: null, organizationName: null, orgJoinStatus: 'none' as const } : {})
      });
    }

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: resetOrg ? null : (targetUser?.organizationId || null),
      organizationName: resetOrg ? null : (targetUser?.organizationName || null),
      actorName: currentUser ? currentUser.name : 'Superadmin',
      actorRole: 'superadmin',
      action: newRole === 'admin' 
        ? 'Promosi Menjadi Admin (Diberikan Akses Membuat 1 Organisasi)' 
        : 'Penyesuaian Hak Akses Menjadi User Biasa',
      target: targetUser ? targetUser.name : userId,
      timestamp: 'Baru saja',
      type: 'user'
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  // Approve Join Request
  const approveJoinRequest = (requestId: string) => {
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;

    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));

    const targetOrg = organizations.find(o => o.code === req.organizationCode || o.name.toLowerCase().includes(req.organizationName.toLowerCase())) || organizations[0];
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
  };

  // Reject Join Request
  const rejectJoinRequest = (requestId: string) => {
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
  };

  // Submit Join Request from Public Screen
  const submitJoinRequest = (orgCode: string, name: string, email: string, dept: string, reason: string) => {
    const org = organizations.find(o => o.code.toLowerCase() === orgCode.trim().toLowerCase());
    if (!org) {
      return { success: false, message: 'Kode organisasi tidak ditemukan dalam database KMS.' };
    }

    const newReq: JoinRequest = {
      id: `req-${Date.now()}`,
      organizationCode: org.code,
      organizationName: org.name,
      applicantName: name,
      applicantEmail: email,
      department: dept,
      reason: reason,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    setJoinRequests(prev => [newReq, ...prev]);
    return { success: true, message: `Permintaan bergabung ke ${org.name} berhasil diajukan. Status saat ini: Pending approval oleh Admin.` };
  };

  // Update RAG Config
  const updateRagConfig = (newConfig: Partial<RagConfig>) => {
    setRagConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Send Chat Message with Context-Aware RAG Retrieval
  const sendChatMessage = async (question: string) => {
    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: question,
      timestamp: 'Baru saja',
      organizationId: currentUser?.organizationId || 'all'
    };

    setChatMessages(prev => [...prev, userMsg]);

    const targetPool = (currentUser?.role === 'superadmin' || !currentUser?.organizationId)
      ? chunks 
      : chunks.filter(c => c.organizationId === currentUser?.organizationId);

    // Clean query words (remove punctuation like '?' so 'internal?' matches 'internal')
    const qClean = question.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = qClean.split(/\s+/).filter(w => w.length > 2);

    const scoredChunks = targetPool.map(chunk => {
      let score = 0.50;
      const contentLower = chunk.content.toLowerCase();
      const titleLower = chunk.documentTitle.toLowerCase();
      const sectionLower = chunk.sectionTitle.toLowerCase();

      words.forEach(word => {
        if (contentLower.includes(word)) score += 0.15;
        if (titleLower.includes(word)) score += 0.20;
        if (sectionLower.includes(word)) score += 0.15;
      });

      return {
        chunk,
        score: Math.min(0.98, score)
      };
    }).sort((a, b) => b.score - a.score);

    const relevantMatches = scoredChunks.filter(item => item.score > 0.65).slice(0, 2);

    let answerText = '';
    const orgName = currentOrganization?.name || currentUser?.organizationName || 'Organisasi';

    if (relevantMatches.length > 0) {
      const topChunk = relevantMatches[0].chunk;
      const additionalChunk = relevantMatches[1] && relevantMatches[1].score > 0.68 ? relevantMatches[1].chunk : null;

      answerText = `${topChunk.content}` + 
        (additionalChunk ? `\n\n${additionalChunk.content}` : '');
    } else {
      // Intelligent Organizational Knowledge Synthesizer
      const isAturanKerja = words.some(w => ['aturan', 'kerja', 'kebijakan', 'internal', 'tertib', 'disiplin', 'etika', 'cuti', 'izin', 'absen', 'presensi', 'jam'].includes(w));
      const isSOP = words.some(w => ['sop', 'prosedur', 'operasional', 'layanan', 'langkah', 'teknis', 'pelaksanaan'].includes(w));
      const isPersetujuan = words.some(w => ['persetujuan', 'approval', 'pengajuan', 'memo', 'tanda', 'tangan', 'otorisasi', 'hierarki'].includes(w));
      const isVisi = words.some(w => ['visi', 'misi', 'profil', 'tentang', 'tujuan', 'fungsi'].includes(w));

      if (isAturanKerja) {
        answerText = `Berikut adalah ringkasan aturan kerja dan kebijakan internal yang berlaku di lingkungan **${orgName}**:\n\n` +
          `1. **Hari & Jam Kerja**: Hari kerja operasional adalah Senin hingga Jumat, pukul 08.00 – 17.00 WIB dengan kewajiban pencatatan kehadiran tepat waktu.\n` +
          `2. **Integritas & Kode Etik**: Setiap anggota wajib menjaga profesionalisme, kejujuran, transparansi, serta kerahasiaan data operasional dan arsip organisasi.\n` +
          `3. **Pengajuan Cuti & Izin**: Permohonan cuti tahunan diajukan paling lambat 3 hari kerja sebelum pelaksanaan melalui atasan langsung dan disetujui divisi SDM/Kepegawaian.\n` +
          `4. **Kepatuhan Terhadap SOP**: Setiap penugasan teknis dan administratif wajib dijalankan sesuai pedoman SOP resmi yang telah diindeks dalam sistem KMS.\n` +
          `5. **Keselamatan & Ketertiban Kerja (K3)**: Penerapan standar K3 di seluruh fasilitas kerja guna mewujudkan lingkungan kerja yang aman, sehat, dan produktif.`;
      } else if (isSOP) {
        answerText = `Standar Operasional Prosedur (SOP) di lingkungan **${orgName}** dilaksanakan melalui tahapan berjenjang:\n\n` +
          `1. **Penerimaan Tugas / Layanan**: Pekerjaan dimulai berdasarkan disposisi pimpinan atau tiket permohonan resmi.\n` +
          `2. **Pemeriksaan Kelengkapan**: Verifikasi kelengkapan dokumen dan kriteria teknis sesuai checklist SOP.\n` +
          `3. **Pelaksanaan Kerja**: Eksekusi penugasan teknis dengan mengacu pada target waktu penyelesaian (SLA) yang telah ditetapkan.\n` +
          `4. **Validasi & Arsip**: Hasil akhir diverifikasi oleh penanggung jawab teknis dan diarsipkan secara digital ke dalam KMS.`;
      } else if (isPersetujuan) {
        answerText = `Alur persetujuan dokumen resmi di **${orgName}** mengikuti mekanisme otoritas berjenjang:\n\n` +
          `1. **Penyusunan Konsep**: Pembuatan draft nota dinas atau surat dinas oleh staf/unit inisiator.\n` +
          `2. **Paraf Koordinasi**: Pemeriksaan substansi dan pemberian paraf bertingkat dari Kepala Seksi hingga Manajer terkait.\n` +
          `3. **Penomoran Arsip**: Registrasi nomor surat dan klasifikasi arsip oleh bagian kesekretariatan.\n` +
          `4. **Persetujuan / Pengesahan**: Penandatanganan akhir oleh Pimpinan / Direksi sebelum dokumen didistribusikan.`;
      } else if (isVisi && currentOrganization?.description) {
        answerText = `**Profil Singkat ${orgName}**:\n\n` +
          `${currentOrganization.description}\n\n` +
          `• **Jenis BUMD**: ${currentOrganization.type}\n` +
          `• **Wilayah Layanan**: ${currentOrganization.city}, ${currentOrganization.province}\n` +
          `• **Fokus**: Menyelenggarakan layanan publik yang prima, andal, dan berkelanjutan bagi masyarakat.`;
      } else {
        answerText = `Berdasarkan pedoman operasional di lingkungan **${orgName}**:\n\n` +
          `Terkait *" ${question} "*:\n` +
          `Pelaksanaan tugas dan pengelolaan informasi selalu mengedepankan asas kepatuhan terhadap SOP, transparansi data, dan akuntabilitas kerja. Apabila membutuhkan petunjuk teknis spesifik perihal dokumen terbaru, Anda dapat berkoordinasi dengan pengelola knowledge base atau mengunggah dokumen pedoman terkait ke dalam sistem.`;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 450));

    const assistantMsg: ChatMessage = {
      id: `msg-a-${Date.now()}`,
      sender: 'assistant',
      text: answerText,
      timestamp: 'Baru saja',
      organizationId: currentUser?.organizationId || 'all',
      retrievalLatencyMs: 240
    };

    setChatMessages(prev => [...prev, assistantMsg]);

    if (currentUser?.organizationId) {
      setOrganizations(prev => prev.map(o => o.id === currentUser.organizationId ? { ...o, aiQueriesCount: o.aiQueriesCount + 1 } : o));
    }

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      organizationId: currentUser?.organizationId || null,
      organizationName: currentUser?.organizationName || null,
      actorName: currentUser ? currentUser.name : 'Pengguna',
      actorRole: currentUser?.role || 'user',
      action: 'Pertanyaan RAG AI',
      target: `"${question.slice(0, 45)}..."`,
      timestamp: 'Baru saja',
      type: 'ai'
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  const clearChatHistory = () => {
    setChatMessages([
      {
        id: `msg-init-${Date.now()}`,
        sender: 'assistant',
        text: 'Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru seputar dokumen dan SOP organisasi Anda.',
        timestamp: 'Baru saja',
        organizationId: currentUser?.organizationId || 'all'
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
