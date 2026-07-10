import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Session 通过 httpOnly Cookie 自动携带，无需手动设置 header

// 响应拦截器：处理 401（session 过期）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 动态 import 避免循环依赖
      import('@/stores/auth').then(({ useAuthStore }) => {
        const auth = useAuthStore()
        auth.logout()
      })
    }
    return Promise.reject(error)
  },
)

export default api
