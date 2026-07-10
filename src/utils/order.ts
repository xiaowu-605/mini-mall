/** 订单状态 → 中文标签 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待付款',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

/** 订单状态 → Element Plus Tag type */
export function statusType(status: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    paid: 'success',
    shipped: '',
    completed: '',
    cancelled: 'info',
  }
  return map[status] ?? 'info'
}
