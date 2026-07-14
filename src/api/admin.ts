import api from './index'
import type {
  Product,
  Order,
  PaginationParams,
  PaginatedList,
  DashboardStats,
  ProductQueryParams,
} from '@/types'

// ---- 商品管理 ----
export function getAdminProducts(params: ProductQueryParams) {
  return api.get<PaginatedList<Product>>('/admin/products', { params })
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

// ---- 仪表盘 ----
export function getDashboardStats() {
  return api.get<DashboardStats>('/admin/dashboard')
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
