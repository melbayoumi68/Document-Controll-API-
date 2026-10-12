import { apiClient } from './client'
import { DocumentVersion } from '@/types'
import { downloadBlob } from '@/lib/utils'

import { storage } from '@/utils/storage'

export const documentVersionsApi = {
  getAll: async () => {
    const user = storage.getUser()
    if (user?.role !== 'SUPER_ADMIN') {
      return []
    }
    const res = await apiClient.get<DocumentVersion[]>('/DocumentVersion')
    return res.data
  },

  getByDocument: async (documentId: number) => {
    const res = await apiClient.get<DocumentVersion[]>(
      `/DocumentVersion/by-document/${documentId}`
    )
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<DocumentVersion>(`/DocumentVersion/${id}`)
    return res.data
  },

  download: async (versionId: number, suggestedFileName?: string) => {
    const res = await apiClient.get<Blob>(`/DocumentVersion/${versionId}/download`, {
      responseType: 'blob',
    })

    // Try to get filename from content-disposition header if available
    let filename = suggestedFileName || `document_version_${versionId}`
    const disposition = res.headers['content-disposition']
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }

    downloadBlob(res.data, filename)
    return res.data
  },
}
