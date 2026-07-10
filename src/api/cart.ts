import api from './index'
import type { CartItem } from '@/types'

// 购物车项列表响应
export interface CartListResponse extends Array<CartItem> {}

// 加入购物车参数
export interface AddCartParams {
  productId: number
  quantity: number
}

// 修改数量参数
export interface UpdateCartParams {
  quantity: number
}

/** 获取购物车列表 */
export function getCart() {
  return api.get<CartItem[]>('/cart')
}

/** 加入购物车 */
export function addToCart(data: AddCartParams) {
  return api.post<CartItem>('/cart', data)
}

/** 修改购物车项数量 */
export function updateCartItem(id: number, data: UpdateCartParams) {
  return api.put<CartItem>(`/cart/${id}`, data)
}

/** 删除购物车项 */
export function removeCartItem(id: number) {
  return api.delete(`/cart/${id}`)
}
