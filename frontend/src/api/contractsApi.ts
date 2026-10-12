import { apiClient } from './client'
import { Contract, CreateContractDto, UpdateContractDto } from '@/types'

export const contractsApi = {
  getAll: async () => {
    const res = await apiClient.get<Contract[]>('/Contract')
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<Contract>(`/Contract/${id}`)
    return res.data
  },

  getByProject: async (projectId: number) => {
    const res = await apiClient.get<Contract[]>(`/Contract/by-project/${projectId}`)
    return res.data
  },

  // Backend derives the current user from the JWT — no userId/role from the client
  getMine: async () => {
    const res = await apiClient.get<Contract[]>('/Contract/mine')
    return res.data
  },

  create: async (data: CreateContractDto) => {
    const res = await apiClient.post<Contract>('/Contract', data)
    return res.data
  },

  update: async (id: number, data: UpdateContractDto) => {
    const res = await apiClient.put<Contract>(`/Contract/${id}`, data)
    return res.data
  },

  activate: async (id: number) => {
    const res = await apiClient.put(`/Contract/${id}/activate`)
    return res.data
  },

  deactivate: async (id: number) => {
    const res = await apiClient.put(`/Contract/${id}/deactivate`)
    return res.data
  },
}
