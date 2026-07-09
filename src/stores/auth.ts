import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMe, logout as logoutApi } from '@/api/auth'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  // 是否已登录
  const isLoggedIn = computed(() => user.value !== null)

  // 是否是管理员
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 是否有某项权限（super_admin 拥有所有权限）
  function hasPermission(perm: string): boolean {
    if (!user.value) return false
    const perms: string[] =
      typeof user.value.permissions === 'string'
        ? JSON.parse(user.value.permissions)
        : user.value.permissions
    if (perms.includes('super_admin')) return true
    return perms.includes(perm)
  }

  // 从服务端获取当前用户
  async function fetchUser() {
    loading.value = true
    try {
      const res = await getMe()
      // 解析 permissions JSON 字符串
      const u = res.data as any
      if (typeof u.permissions === 'string') {
        u.permissions = JSON.parse(u.permissions)
      }
      user.value = u
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  async function logout() {
    try {
      await logoutApi()
    } finally {
      user.value = null
    }
  }

  return { user, loading, isLoggedIn, isAdmin, hasPermission, fetchUser, logout }
})
