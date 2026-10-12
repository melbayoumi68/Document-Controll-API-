import { apiClient } from './client'
import { Project, CreateProjectDto, UpdateProjectDto } from '@/types'

export const projectsApi = {
  getAll: async (activeOnly?: boolean) => {
    const params = activeOnly ? { activeOnly: true } : {}
    const res = await apiClient.get<Project[]>('/Project', { params })
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<Project>(`/Project/${id}`)
    return res.data
  },

  create: async (data: CreateProjectDto) => {
    const res = await apiClient.post<Project>('/Project', data)
    return res.data
  },

  update: async (id: number, data: UpdateProjectDto) => {
    const res = await apiClient.put<Project>(`/Project/${id}`, data)
    return res.data
  },

  activate: async (id: number) => {
    const res = await apiClient.put(`/Project/${id}/activate`)
    return res.data
  },

  deactivate: async (id: number) => {
    const res = await apiClient.put(`/Project/${id}/deactivate`)
    return res.data
  },
  delete: async (id: number) => {
    const res = await apiClient.delete(`/Project/${id}`)
    return res.data
  },
}
