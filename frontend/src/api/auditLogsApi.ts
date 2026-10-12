import { apiClient } from './client'
import { AuditLog } from '@/types'

export const auditLogsApi = {
  getAll: async () => {
    const res = await apiClient.get<AuditLog[]>('/AuditLog')
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<AuditLog>(`/AuditLog/${id}`)
    return res.data
  },
}
