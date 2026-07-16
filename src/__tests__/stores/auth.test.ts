import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态用户应为 null，未登录', () => {
    const auth = useAuthStore()
    expect(auth.user).toBeNull()
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.isAdmin).toBe(false)
  })

  it('普通用户 hasPermission 应返回 false', () => {
    const auth = useAuthStore()
    // 模拟设置用户
    auth.$patch({
      user: {
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        role: 'user',
        permissions: [],
        memberLevel: 0,
        totalSpent: 0,
        createdAt: '',
      },
    } as any)
    expect(auth.hasPermission('manage_products')).toBe(false)
  })

  it('admin 用户 hasPermission 应根据权限返回', () => {
    const auth = useAuthStore()
    auth.$patch({
      user: {
        id: 2,
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
        permissions: ['manage_products'],
        memberLevel: 0,
        totalSpent: 0,
        createdAt: '',
      },
    } as any)
    expect(auth.isAdmin).toBe(true)
    expect(auth.hasPermission('manage_products')).toBe(true)
    expect(auth.hasPermission('manage_orders')).toBe(false)
  })

  it('super_admin 拥有所有权限', () => {
    const auth = useAuthStore()
    auth.$patch({
      user: {
        id: 3,
        email: 'super@test.com',
        name: 'Super',
        role: 'admin',
        permissions: ['super_admin'],
        memberLevel: 0,
        totalSpent: 0,
        createdAt: '',
      },
    } as any)
    expect(auth.hasPermission('manage_products')).toBe(true)
    expect(auth.hasPermission('manage_orders')).toBe(true)
    expect(auth.hasPermission('manage_categories')).toBe(true)
    expect(auth.hasPermission('manage_users')).toBe(true)
  })

  it('logout 后 user 应为 null', async () => {
    const auth = useAuthStore()
    // 模拟已登录
    auth.$patch({
      user: {
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        role: 'user',
        permissions: [],
        memberLevel: 0,
        totalSpent: 0,
        createdAt: '',
      },
    } as any)
    expect(auth.isLoggedIn).toBe(true)

    // logout 调用 API 会失败（无服务端），但 user 仍会被清空
    await auth.logout()
    expect(auth.user).toBeNull()
  })
})
