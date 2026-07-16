import { describe, it, expect } from 'vitest'
import { statusLabel, statusType } from '@/utils/order'

describe('statusLabel', () => {
  it('应返回各状态对应的中文标签', () => {
    expect(statusLabel('pending')).toBe('待付款')
    expect(statusLabel('paid')).toBe('已支付')
    expect(statusLabel('shipped')).toBe('已发货')
    expect(statusLabel('completed')).toBe('已完成')
    expect(statusLabel('cancelled')).toBe('已取消')
  })

  it('未知状态应返回原始值', () => {
    expect(statusLabel('unknown')).toBe('unknown')
  })
})

describe('statusType', () => {
  it('应返回各状态对应的 Element Plus Tag type', () => {
    expect(statusType('pending')).toBe('warning')
    expect(statusType('paid')).toBe('success')
    expect(statusType('shipped')).toBe('')
    expect(statusType('completed')).toBe('')
    expect(statusType('cancelled')).toBe('info')
  })

  it('未知状态默认返回 info', () => {
    expect(statusType('unknown')).toBe('info')
  })
})
