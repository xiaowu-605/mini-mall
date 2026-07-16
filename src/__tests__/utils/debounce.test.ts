import { describe, it, expect, vi } from 'vitest'
import { createDebounce } from '@/utils/debounce'

describe('createDebounce', () => {
  it('应在 delay 毫秒后才执行回调', async () => {
    vi.useFakeTimers()
    const debounce = createDebounce(300)
    const fn = vi.fn()

    debounce(fn)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('多次调用应只执行最后一次', async () => {
    vi.useFakeTimers()
    const debounce = createDebounce(200)
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const fn3 = vi.fn()

    debounce(fn1)
    debounce(fn2)
    debounce(fn3)

    vi.advanceTimersByTime(200)

    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
    expect(fn3).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('默认延迟应为 300ms', async () => {
    vi.useFakeTimers()
    const debounce = createDebounce()
    const fn = vi.fn()

    debounce(fn)
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
