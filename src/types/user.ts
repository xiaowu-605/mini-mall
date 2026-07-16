/** 用户 */
export interface User {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  permissions?: string[]
  status?: string
  memberLevel: number
  totalSpent: number
  createdAt: string
}
