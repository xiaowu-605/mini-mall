import type { Product } from './product'

/** 订单项 */
export interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  price: number
  product?: Product
}

/** 订单 */
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
