import { apiClient } from './client'
import { ConsultantReview, SubmitReviewDto } from '@/types'

import { storage } from '@/utils/storage'

export const consultantReviewsApi = {
  getAll: async () => {
    const user = storage.getUser()
    if (user?.role !== 'SUPER_ADMIN') {
      return []
    }
    const res = await apiClient.get<ConsultantReview[]>('/ConsultantReview')
    return res.data
  },

  getById: async (id: number) => {
    const res = await apiClient.get<ConsultantReview>(`/ConsultantReview/${id}`)
    return res.data
  },

  getByVersion: async (versionId: number) => {
    const res = await apiClient.get<ConsultantReview[]>(
      `/ConsultantReview/by-version/${versionId}`
    )
    return res.data
  },

  submitReview: async (data: SubmitReviewDto) => {
    const res = await apiClient.post<ConsultantReview>(
      '/ConsultantReview/submit',
      data
    )
    return res.data
  },
}
