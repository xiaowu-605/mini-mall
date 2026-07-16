import { describe, it, expect } from 'vitest'
import { formatTime } from '@/utils/format'

describe('formatTime', () => {
  it('应将 ISO 字符串格式化为中文时间', () => {
    const result = formatTime('2025-01-15T10:30:00.000Z')
    expect(result).toContain('2025')
    expect(typeof result).toBe('string')
  })

  it('空字符串应返回 --', () => {
    expect(formatTime('')).toBe('--')
  })

  it('无效日期应返回 --', () => {
    expect(formatTime('not-a-date')).toBe('--')
  })
})
