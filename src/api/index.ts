import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Session 通过 httpOnly Cookie 自动携带，无需手动设置 header

export default api
