/** 分页查询参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页响应（公开 API） */
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
