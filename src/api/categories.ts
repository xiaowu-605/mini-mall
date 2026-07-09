import api from './index'
import type { Category } from '@/types'

// 获取分类列表
export function getCategories() {
  return api.get<Category[]>('/categories')
}
