import { apiClient } from './client'
import type { CodingOrderItem, UpdateCodingOrderDto } from '@/types/coding'

export const codingOrderApi = {
  get: async () => {
    const res = await apiClient.get<CodingOrderItem[]>('/coding-order')
    return res.data
  },

  update: async (dto: UpdateCodingOrderDto) => {
    const res = await apiClient.put<CodingOrderItem[]>('/coding-order', dto)
    return res.data
  },
}
