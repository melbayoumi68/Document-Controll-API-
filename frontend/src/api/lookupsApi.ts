import { apiClient } from './client'
import {
  Contractor,
  Department,
  DocumentType,
  DocumentCategory,
  CreateContractorDto,
  UpdateContractorDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  CreateDocumentCategoryDto,
  UpdateDocumentCategoryDto,
} from '@/types'

export const contractorsApi = {
  getAll: async (activeOnly?: boolean) => {
    const params = activeOnly ? { activeOnly: true } : {}
    const res = await apiClient.get<Contractor[]>('/Contractor', { params })
    return res.data
  },
  getById: async (id: number) => {
    const res = await apiClient.get<Contractor>(`/Contractor/${id}`)
    return res.data
  },
  create: async (data: CreateContractorDto) => {
    const res = await apiClient.post<Contractor>('/Contractor', data)
    return res.data
  },
  update: async (id: number, data: UpdateContractorDto) => {
    const res = await apiClient.put<Contractor>(`/Contractor/${id}`, data)
    return res.data
  },
  activate: async (id: number) => {
    const res = await apiClient.put(`/Contractor/${id}/activate`)
    return res.data
  },
  deactivate: async (id: number) => {
    const res = await apiClient.put(`/Contractor/${id}/deactivate`)
    return res.data
  },
}

export const departmentsApi = {
  getAll: async (activeOnly?: boolean) => {
    const params = activeOnly ? { activeOnly: true } : {}
    const res = await apiClient.get<Department[]>('/Department', { params })
    return res.data
  },
  getById: async (id: number) => {
    const res = await apiClient.get<Department>(`/Department/${id}`)
    return res.data
  },
  create: async (data: CreateDepartmentDto) => {
    const res = await apiClient.post<Department>('/Department', data)
    return res.data
  },
  update: async (id: number, data: UpdateDepartmentDto) => {
    const res = await apiClient.put<Department>(`/Department/${id}`, data)
    return res.data
  },
  activate: async (id: number) => {
    const res = await apiClient.put(`/Department/${id}/activate`)
    return res.data
  },
  deactivate: async (id: number) => {
    const res = await apiClient.put(`/Department/${id}/deactivate`)
    return res.data
  },
}

export const documentTypesApi = {
  getAll: async () => {
    const res = await apiClient.get<DocumentType[]>('/DocumentType')
    return res.data
  },
  getById: async (id: number) => {
    const res = await apiClient.get<DocumentType>(`/DocumentType/${id}`)
    return res.data
  },
  create: async (data: CreateDocumentTypeDto) => {
    const res = await apiClient.post<DocumentType>('/DocumentType', data)
    return res.data
  },
  update: async (id: number, data: UpdateDocumentTypeDto) => {
    const res = await apiClient.put<DocumentType>(`/DocumentType/${id}`, data)
    return res.data
  },
  getCategories: async (typeId: number) => {
    const res = await apiClient.get<DocumentCategory[]>(`/DocumentType/${typeId}/categories`)
    return res.data
  },
  assignCategories: async (typeId: number, categoryIds: number[]) => {
    const res = await apiClient.put<DocumentType>(`/DocumentType/${typeId}/categories`, {
      categoryIds,
    })
    return res.data
  },
  activate: async (id: number) => {
    const res = await apiClient.put(`/DocumentType/${id}/activate`)
    return res.data
  },
  deactivate: async (id: number) => {
    const res = await apiClient.put(`/DocumentType/${id}/deactivate`)
    return res.data
  },
}

export const documentCategoriesApi = {
  getAll: async (documentTypeId?: number) => {
    const params = documentTypeId != null ? { documentTypeId } : {}
    const res = await apiClient.get<DocumentCategory[]>('/DocumentCategory', { params })
    return res.data
  },
  getById: async (id: number) => {
    const res = await apiClient.get<DocumentCategory>(`/DocumentCategory/${id}`)
    return res.data
  },
  getByDocumentType: async (documentTypeId: number) => {
    const res = await apiClient.get<DocumentCategory[]>('/DocumentCategory', {
      params: { documentTypeId },
    })
    return res.data
  },
  create: async (data: CreateDocumentCategoryDto) => {
    const res = await apiClient.post<DocumentCategory>('/DocumentCategory', data)
    return res.data
  },
  update: async (id: number, data: UpdateDocumentCategoryDto) => {
    const res = await apiClient.put<DocumentCategory>(`/DocumentCategory/${id}`, data)
    return res.data
  },
  activate: async (id: number) => {
    const res = await apiClient.put(`/DocumentCategory/${id}/activate`)
    return res.data
  },
  deactivate: async (id: number) => {
    const res = await apiClient.put(`/DocumentCategory/${id}/deactivate`)
    return res.data
  },
}
