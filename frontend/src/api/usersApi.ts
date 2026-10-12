import { apiClient } from './client'
import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto } from '@/types'

import { storage } from '@/utils/storage'

export const usersApi = {
  getAll: async (activeOnly?: boolean) => {
    const user = storage.getUser()
    if (user?.role !== 'SUPER_ADMIN') {
      return []
    }
    const params = activeOnly ? { activeOnly: true } : {}
    const res = await apiClient.get<User[]>('/users', { params })
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<User>(`/users/${id}`)
    return res.data
  },

  create: async (data: CreateUserDto) => {
    const res = await apiClient.post<User>('/users', data)
    return res.data
  },

  update: async (id: number, data: UpdateUserDto) => {
    const res = await apiClient.put<User>(`/users/${id}`, data)
    return res.data
  },

  activate: async (id: number) => {
    const res = await apiClient.put(`/users/activate/${id}`)
    return res.data
  },

  deactivate: async (id: number) => {
    const res = await apiClient.put(`/users/deactivate/${id}`)
    return res.data
  },

  changePassword: async (id: number, data: ChangePasswordDto) => {
    const res = await apiClient.put(`/users/change-password/${id}`, data)
    return res.data
  },
  delete: async (id: number) => {
  const res = await apiClient.delete(`/users/${id}`)
  return res.data
},
}
