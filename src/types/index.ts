// 用户
export interface User {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  permissions: string[]
  memberLevel: number
  totalSpent: number
  createdAt: string
}

// 分类
export interface Category {
  id: number
  name: string
  productCount?: number
}

// 商品
export interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string | null
  stock: number
  categoryId: number
  category?: Category
  createdAt: string
  updatedAt: string
}

// 购物车项
export interface CartItem {
  id: number
  userId: number
  productId: number
  quantity: number
  product?: Product
}

// 订单项
export interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  price: number
  product?: Product
}

// 订单
export interface Order {
  id: number
  userId: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  total: number
  discount: number
  discountedTotal: number
  address: string
  phone: string
  createdAt: string
  items?: OrderItem[]
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// API 响应
export interface ApiResponse<T = any> {
  data?: T
  error?: string
}
