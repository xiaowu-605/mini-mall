import api from './index'
import type { Order } from '@/types'

/** 创建订单 */
export function createOrder(data: { address: string; phone: string }) {
  return api.post<Order>('/orders', data)
}

/** 获取我的订单列表 */
export function getMyOrders() {
  return api.get<Order[]>('/orders')
}

/** 获取订单详情 */
export function getOrderById(id: number) {
  return api.get<Order>(`/orders/${id}`)
}

/** 操作订单（pay / cancel） */
export function updateOrder(id: number, data: { action: 'pay' | 'cancel' }) {
  return api.put<Order>(`/orders/${id}`, data)
}
