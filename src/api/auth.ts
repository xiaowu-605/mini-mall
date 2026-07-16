import api from './index'
import type { User } from '@/types'

/** 注册 */
export function register(data: {
  email: string
  password: string
  name: string
}) {
  return api.post<Omit<User, 'permissions' | 'memberLevel' | 'totalSpent'>>(
    '/auth/register',
    data,
  )
}

/** 登录 */
export function login(data: { email: string; password: string }) {
  return api.post<Omit<User, 'permissions' | 'memberLevel' | 'totalSpent'>>(
    '/auth/login',
    data,
  )
}

/** 获取当前用户 */
export function getMe() {
  return api.get<User>('/auth/me')
}

/** 退出登录 */
export function logout() {
  return api.post('/auth/logout')
}

/** 获取演示账号列表（开发环境一键填入） */
export interface DemoAccount {
  id: number
  email: string
  name: string
  role: string
  permissions: string[]
  memberLevel: number
  password: string
  roleLabel: string
}

export function getDemoAccounts() {
  return api.get<DemoAccount[]>('/auth/demo-accounts')
}
