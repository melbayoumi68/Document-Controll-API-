import { RoleType, RatingType } from './constants'

export interface CreateProjectDto {
  projectName: string
  projectCode: string
  region?: string
  description?: string
}

export interface UpdateProjectDto {
  projectName: string
  projectCode: string
  region?: string
  description?: string
}

export interface CreateContractDto {
  projectId: number
  contractName: string
  contractCode: string
  startDate?: string
}

export interface UpdateContractDto {
  contractName: string
  contractCode: string
  startDate?: string
}

export interface CreateContractorDto {
  name: string
  abbreviation: string
}

export interface UpdateContractorDto {
  name: string
  abbreviation: string
}

export interface CreateDepartmentDto {
  name: string
  code: string
}

export interface UpdateDepartmentDto {
  name: string
  code: string
}

export interface CreateDocumentTypeDto {
  name: string
  abbreviation: string
  categoryIds?: number[]
}

export interface UpdateDocumentTypeDto {
  name: string
  abbreviation: string
  isActive?: boolean
  categoryIds?: number[]
}

export interface AssignCategoriesToTypeDto {
  categoryIds: number[]
}

export interface CreateDocumentCategoryDto {
  categoryName: string
  categoryCode: string
}

export interface UpdateDocumentCategoryDto {
  categoryName: string
  categoryCode: string
}

export interface CreateUserDto {
  username: string
  email: string
  password: string
  fullName: string
  role: RoleType
  departmentId?: number | null
}

export interface UpdateUserDto {
  email: string
  fullName: string
  role: RoleType
  departmentId?: number | null
  isActive: boolean
}

export interface ChangePasswordDto {
  newPassword: string
}

export interface AssignEngineerDto {
  projectId: number
  contractId: number
  userId: number
}

export interface AssignConsultantDto {
  projectId: number
  contractId: number
  userId: number
}

// Identity fields (CreatedByUserId, UploadedByUserId, ConsultantUserId) are
// always derived from the JWT on the backend — never sent from the client.
export interface SubmitDocumentFormData {
  contractId: number
  documentTypeId: number
  documentCategoryId: number
  contractorId?: number
  title?: string
  description?: string
  notes?: string
  file: File
  inspectionRef?: string
  issueDate?: string
  inspectionDate?: string
  dueDate?: string
  zone?: string
  building?: string
  axis?: string
  issuedByUserId?: number
  documentControllerUserId?: number
  remarks?: string
}

export interface UploadVersionFormData {
  documentId: number
  notes?: string
  file: File
}

export interface SubmitReviewDto {
  versionId: number
  rating: RatingType
  comments?: string
}
