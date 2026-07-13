import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

/** 服务端错误响应结构 */
interface ErrorResponse {
  error?: string
  message?: string
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Session 通过 httpOnly Cookie 自动携带，无需手动设置 header

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    // 无响应：网络超时或断网
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请稍后重试')
      } else {
        ElMessage.error('网络连接失败，请检查网络')
      }
      return Promise.reject(error)
    }

    const { status, data } = error.response

    const url = error.config?.url || ''

    switch (status) {
      case 401:
        // /auth/me 返回 401 表示未登录（游客正常状态），静默处理
        if (url === '/auth/me') break
        // /auth/login 返回 401 是密码错误等业务错误，展示服务端消息
        if (url === '/auth/login') {
          ElMessage.error(data?.error || '邮箱或密码不正确')
          break
        }
        // 其他接口 401：session 过期，自动登出
        import('@/stores/auth').then(({ useAuthStore }) => {
          useAuthStore()
            .logout()
            .catch(() => {})
        })
        ElMessage.error('登录已过期，请重新登录')
        break
      case 403:
        ElMessage.error('暂无权限执行此操作')
        break
      case 404:
        // 404 由各页面自行处理（如跳转、展示空状态），不弹全局提示
        break
      case 500:
        ElMessage.error(data?.error || '服务器异常，请稍后重试')
        break
      default:
        // 其他状态码（400/422 等业务错误），使用服务端返回的错误信息
        ElMessage.error(data?.error || data?.message || '请求失败')
    }

    return Promise.reject(error)
  },
)

export default api
