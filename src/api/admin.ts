import api from './index'
import type { Product, Order } from '@/types'

/** 分页查询参数 */
interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页查询结果 */
interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ---- 商品管理 ----
export function getAdminProducts(params: PaginationParams) {
  return api.get<PaginatedResponse<Product>>('/admin/products', { params })
}

export function createAdminProduct(data: any) {
  return api.post<Product>('/admin/products', data)
}

export function updateAdminProduct(id: number, data: any) {
  return api.put<Product>(`/admin/products/${id}`, data)
}

export function deleteAdminProduct(id: number) {
  return api.delete(`/admin/products/${id}`)
}

// ---- 订单管理 ----
export function getAdminOrders() {
  return api.get<Order[]>('/admin/orders')
}

export function updateAdminOrderStatus(id: number, status: string) {
  return api.put<Order>(`/admin/orders/${id}`, { status })
}

// ---- 图片上传 ----
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<{ url: string }>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ---- 分类管理 ----
export function getAdminCategories() {
  return api.get<any[]>('/admin/categories')
}

export function createAdminCategory(name: string) {
  return api.post<any>('/admin/categories', { name })
}

export function deleteAdminCategory(id: number) {
  return api.delete(`/admin/categories/${id}`)
}
