import { RoleType, DocumentStatusType, RatingType } from './constants'

export interface Project {
  projectId: number
  projectName: string
  projectCode: string
  region?: string | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
  contractsCount?: number
}

export interface Contract {
  contractId: number
  projectId: number
  contractName: string
  contractCode: string
  startDate?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
  projectName?: string
  documentsCount?: number
  engineersCount?: number
  consultantsCount?: number
}

export interface Contractor {
  contractorId: number
  name: string
  abbreviation: string
  isActive: boolean
  createdAt: string
}

export interface Department {
  departmentId: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
}

export interface DocumentType {
  documentTypeId: number
  name: string
  abbreviation: string
  isActive: boolean
  createdAt?: string
  categories?: DocumentCategory[]
}

export interface DocumentCategory {
  categoryId: number
  categoryName: string
  categoryCode: string
  isActive: boolean
  createdAt?: string
}

export interface User {
  userId: number
  username: string
  email: string
  fullName: string
  role: RoleType
  departmentId?: number | null
  isActive: boolean
  createdAt: string
}

export interface ContractEngineerAssignment {
  contractEngineerId: number
  contractId: number
  projectId: number
  projectName: string
  userId: number
  assignedAt: string
}

export interface ContractConsultantAssignment {
  contractConsultantId: number
  contractId: number
  projectId: number
  projectName: string
  userId: number
  assignedAt: string
  invitationSent: boolean
  invitationSentAt?: string | null
}

export interface ContractAssignments {
  contractId: number
  engineers: ContractEngineerAssignment[]
  consultants: ContractConsultantAssignment[]
}

export interface Document {
  documentId: number
  documentNumber: string
  contractId: number
  documentTypeId: number
  documentCategoryId: number
  contractorId?: number | null
  serialNumber: string
  status: DocumentStatusType
  title?: string | null
  description?: string | null
  createdByUserId: number
  currentVersionNumber: string
  createdAt: string
  updatedAt?: string | null
  // Log fields (all document types)
  inspectionRef?: string | null
  issueDate?: string | null
  inspectionDate?: string | null
  dueDate?: string | null
  replyDate?: string | null
  zone?: string | null
  building?: string | null
  axis?: string | null
  issuedByUserId?: number | null
  documentControllerUserId?: number | null
  remarks?: string | null
  overdue?: boolean
  daysOverdue?: number
  code?: string
}

export interface DocumentVersion {
  versionId: number
  documentId: number
  versionNumber: string
  fileName?: string | null
  filePath?: string | null
  fileContentType?: string | null
  fileSizeBytes?: number | null
  uploadedByUserId: number
  uploadedAt: string
  reviewStatus: DocumentStatusType
  notes?: string | null
}

export interface ConsultantReview {
  reviewId: number
  versionId: number
  consultantUserId: number
  rating: RatingType
  comments?: string | null
  reviewDate: string
}

export interface Notification {
  notificationId: number
  userId: number
  title: string
  message: string
  isRead: boolean
  projectId?: number | null
  contractId?: number | null
  documentId?: number | null
  versionId?: number | null
  type?: string | null
  createdAt: string
}

export interface AuditLog {
  auditLogId: number
  userId?: number | null
  action: string
  entityType: string
  entityId?: number | null
  details?: string | null
  timestamp: string
}

