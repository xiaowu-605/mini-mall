/** 分页列表响应（后台管理 API） */
export interface PaginatedList<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 仪表盘统计数据 */
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  todayOrders: number
  todayRevenue: number
  totalUsers: number
  totalProducts: number
}
