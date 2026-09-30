export type UserRole = 'superadmin' | 'admin' | 'user';
export type Role = UserRole | 'SUPERADMIN' | 'ADMIN' | 'USER';

export type MembershipStatus = 'none' | 'pending' | 'joined' | 'active';

export type OrgType = 
  | 'BUMD Air Minum' 
  | 'BUMD Perbankan' 
  | 'BUMD Pangan & Pasar' 
  | 'BUMD Transportasi' 
  | 'BUMD Energi & Infrastruktur'
  | string;

export interface Organization {
  id: string;
  name: string;
  code: string;
  description: string;
  type: OrgType;
  sector: string;
  province: string;
  city: string;
  adminId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  documentsCount: number;
  usersCount: number;
  chunksCount: number;
  aiQueriesCount: number;
  storageUsedMb: number;
  status: 'active' | 'inactive';
  createdAt: string;
  logoInitials?: string;
  // compatibility aliases
  admin_name?: string | null;
  admin_email?: string | null;
  documents_count?: number;
  users_count?: number;
  chunks_count?: number;
  ai_queries_count?: number;
  storage_mb?: number;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  department?: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  avatarInitials: string;
  avatarUrl?: string;
  phone?: string;
  employeeId?: string;
  position?: string;
  adminStructuralRole?: string;
  emergencyContact?: string;
  serverCluster?: string;
  orgJoinStatus?: 'joined' | 'pending' | 'none';
  // compatibility aliases
  organization_id?: string | null;
  organization_name?: string | null;
  membership_status?: MembershipStatus;
  joined_at?: string;
  avatar_initials?: string;
}

export type DocumentCategory = 
  | 'SOP & Prosedur' 
  | 'Kebijakan & Regulasi' 
  | 'Pedoman Teknis' 
  | 'Laporan Kinerja' 
  | 'Audit & Kepatuhan' 
  | 'Tata Kelola BUMD'
  | 'Laporan Keuangan'
  | 'Regulasi & Perda'
  | 'Engineering & Teknis'
  | 'Kebijakan HR'
  | 'Perencanaan Strategis'
  | string;

export interface DocumentItem {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  category: DocumentCategory;
  year: number;
  fileType: 'PDF' | 'DOCX' | 'XLSX';
  fileSizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
  version: string;
  status: 'ready' | 'processing' | 'failed' | 'archived' | 'indexed' | string;
  chunksCount: number;
  summary: string;
  tags: string[];
  department?: string;
  // compatibility aliases
  organization_id?: string;
  organization_name?: string;
  file_type?: 'PDF' | 'DOCX' | 'XLSX';
  file_size_kb?: number;
  uploaded_by?: string;
  uploaded_at?: string;
  chunks_count?: number;
  description?: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  organizationId: string;
  organizationName: string;
  chunkIndex: number;
  totalChunks: number;
  sectionTitle: string;
  content: string;
  tokenCount: number;
  status?: 'ready' | 'processing' | 'failed' | 'archived' | 'indexed' | string;
  updatedAt?: string;
  category?: string;
  year?: number;
  embeddingStatus?: 'indexed' | 'pending' | 'failed' | 'embedded' | string;
  embeddingVectorSample?: number[];
  // compatibility aliases
  document_id?: string;
  document_title?: string;
  organization_id?: string;
  organization_name?: string;
  chunk_index?: number;
  total_chunks?: number;
  section_title?: string;
  token_count?: number;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  actorName: string;
  actorRole: UserRole | string;
  action: string;
  target: string;
  timestamp: string;
  type: 'document' | 'user' | 'ai' | 'organization' | 'security';
}

export type ActivityItem = ActivityLog;

export interface JoinRequest {
  id: string;
  organizationCode: string;
  organizationName: string;
  applicantName: string;
  applicantEmail: string;
  department: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  userId?: string;
  organizationId?: string;
  // compatibility aliases
  user_id?: string;
  user_name?: string;
  user_email?: string;
  organization_id?: string;
  organization_name?: string;
  requested_at?: string;
  note?: string;
}

export interface RagConfig {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  topK?: number;
  topKRetrieval?: number;
  similarityThreshold: number;
  rerankEnabled?: boolean;
  temperature?: number;
  systemPrompt: string;
}

export interface CitationReference {
  chunkId: string;
  documentTitle: string;
  organizationName?: string;
  snippet: string;
  similarityScore?: number;
  category?: string;
  year?: number;
  page?: string | number;
  documentId?: string;
  sectionTitle?: string;
  relevanceScore?: number;
}

export type SourceCitation = CitationReference;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  organizationId: string;
  sources?: CitationReference[];
  citations?: CitationReference[];
  responseTimeMs?: number;
  retrievalLatencyMs?: number;
  latency_ms?: number;
  organization_id?: string;
}
