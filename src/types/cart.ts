import type { Product } from './product'

/** 购物车项 */
export interface CartItem {
  id: number
  userId: number
  productId: number
  quantity: number
  product?: Product
}
