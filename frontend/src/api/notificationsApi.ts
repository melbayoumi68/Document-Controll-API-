import { apiClient } from './client'
import { Notification } from '@/types'

export const notificationsApi = {
  getAll: async () => {
    const res = await apiClient.get<Notification[]>('/Notification')
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<Notification>(`/Notification/${id}`)
    return res.data
  },

  // Backend derives the current user from the JWT
  getMy: async () => {
    const res = await apiClient.get<Notification[]>('/Notification/my')
    return res.data
  },

  markAsRead: async (id: number) => {
    const res = await apiClient.put<Notification>(`/Notification/${id}`, { isRead: true })
    return res.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/Notification/${id}`)
  },
}
