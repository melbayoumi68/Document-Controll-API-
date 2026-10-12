import { useQuery } from '@tanstack/react-query'
import { codingOrderApi } from '@/api'
import { DEFAULT_CODING_ORDER } from '@/types/coding'

/**
 * يجلب ترتيب أجزاء الترقيم من الـ Backend.
 * يُستخدم في DocumentDetail و SubmitDocument و صفحة الإعدادات.
 */
export function useCodingOrder() {
  return useQuery({
    queryKey: ['coding-order'],
    queryFn: codingOrderApi.get,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_CODING_ORDER,
  })
}
