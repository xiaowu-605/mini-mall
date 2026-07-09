/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** API 通用响应 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
}
