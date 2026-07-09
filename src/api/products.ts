import api from './index'
import type { Product, PaginatedResponse } from '@/types'

// 商品列表查询参数
export interface ProductListParams {
  search?: string
  categoryId?: number
  page?: number
  pageSize?: number
}

// 获取商品列表
export function getProducts(params: ProductListParams = {}) {
  return api.get<PaginatedResponse<Product>>('/products', { params })
}

// 获取商品详情
export function getProductById(id: number) {
  return api.get<Product>(`/products/${id}`)
}
