/** 分页列表响应（后台管理 API） */
export interface PaginatedList<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 商品管理查询参数 */
export interface ProductQueryParams {
  page: number
  pageSize: number
  search?: string
  categoryId?: number
  stockZero?: boolean
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
  orderTrend: { date: string; count: number }[]
  categoryDistribution: { name: string; value: number }[]
  orderStatusDistribution: { status: string; count: number }[]
}
