import { describe, it, expect } from 'vitest'
import { useAsyncData } from '@/hooks/useAsyncData'

describe('useAsyncData', () => {
  it('成功后 loading 应为 false', async () => {
    const { loading, error, run } = useAsyncData()
    const result = await run(() => Promise.resolve('success'))
    expect(result).toBe('success')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(false)
  })

  it('失败时 error 应为 true，返回 undefined', async () => {
    const { loading, error, run } = useAsyncData()
    const result = await run(() => Promise.reject(new Error('fail')))
    expect(result).toBeUndefined()
    expect(loading.value).toBe(false)
    expect(error.value).toBe(true)
  })

  it('执行期间 loading 应为 true', async () => {
    const { loading, run } = useAsyncData()
    let capturedLoading = false
    const promise = run(async () => {
      capturedLoading = loading.value
      return 'done'
    })
    await promise
    expect(capturedLoading).toBe(true)
  })
})
