import { ref } from 'vue'

/** 异步数据加载 hook：统一管理 loading / error 状态 */
export function useAsyncData() {
  const loading = ref(false)
  const error = ref(false)

  /** 执行异步请求 */
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    error.value = false
    try {
      return await fn()
    } catch (e) {
      error.value = true
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
