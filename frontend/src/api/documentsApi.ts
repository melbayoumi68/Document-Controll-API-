import { apiClient } from './client'
import {
  Document,
  DocumentVersion,
  SubmitDocumentFormData,
  UploadVersionFormData,
  DocumentStatusType,
} from '@/types'

export const documentsApi = {
  // Admin-only listing (GET /Document is guarded by SuperAdmin role on the backend)
  getAll: async () => {
    const res = await apiClient.get<Document[]>('/Document')
    return res.data
  },

  // Role-scoped listing: backend resolves engineer/consultant scope from the JWT
  getMyDocuments: async () => {
    const res = await apiClient.get<Document[]>('/Document/my-documents')
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<Document>(`/Document/${id}`)
    return res.data
  },

  getByContract: async (contractId: number) => {
    const res = await apiClient.get<Document[]>(`/Document/by-contract/${contractId}`)
    return res.data
  },

  getByStatus: async (status: DocumentStatusType) => {
    const res = await apiClient.get<Document[]>(`/Document/by-status/${status}`)
    return res.data
  },

  getPendingForMe: async () => {
    const res = await apiClient.get<Document[]>('/Document/pending-for-me')
    return res.data
  },

  getRequiresRevisionForMe: async () => {
    const res = await apiClient.get<Document[]>('/Document/requires-revision-for-me')
    return res.data
  },

  // createdByUserId is forced server-side from the JWT
  submit: async (data: SubmitDocumentFormData) => {
    const formData = new FormData()
    formData.append('contractId', data.contractId.toString())
    formData.append('documentTypeId', data.documentTypeId.toString())
    formData.append('documentCategoryId', data.documentCategoryId.toString())
    if (data.contractorId) {
      formData.append('contractorId', data.contractorId.toString())
    }
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.notes) formData.append('notes', data.notes)
    if (data.inspectionRef) formData.append('inspectionRef', data.inspectionRef)
    if (data.issueDate) formData.append('issueDate', data.issueDate)
    if (data.inspectionDate) formData.append('inspectionDate', data.inspectionDate)
    if (data.dueDate) formData.append('dueDate', data.dueDate)
    if (data.zone) formData.append('zone', data.zone)
    if (data.building) formData.append('building', data.building)
    if (data.axis) formData.append('axis', data.axis)
    if (data.issuedByUserId) formData.append('issuedByUserId', data.issuedByUserId.toString())
    if (data.documentControllerUserId)
      formData.append('documentControllerUserId', data.documentControllerUserId.toString())
    if (data.remarks) formData.append('remarks', data.remarks)
    formData.append('file', data.file)

    const res = await apiClient.post<Document>('/Document/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  // uploadedByUserId is forced server-side from the JWT
  uploadVersion: async (data: UploadVersionFormData) => {
    const formData = new FormData()
    formData.append('documentId', data.documentId.toString())
    if (data.notes) formData.append('notes', data.notes)
    formData.append('file', data.file)

    const res = await apiClient.post<DocumentVersion>('/Document/upload-version', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/Document/${id}`)
  },
}
