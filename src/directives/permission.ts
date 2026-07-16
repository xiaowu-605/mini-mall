import type { Directive, App } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * v-permission 权限指令
 * 用法：<el-button v-permission="'manage_products'">新增</el-button>
 * 无权限时隐藏元素（display: none）+ 禁用交互；super_admin 拥有所有权限
 */
const permission: Directive = {
  mounted(el, binding) {
    check(el, binding)
  },
  updated(el, binding) {
    check(el, binding)
  },
}

/** 校验权限并控制元素可见性 */
function check(el: HTMLElement, binding: any) {
  const auth = useAuthStore()
  const perm = binding.value as string
  if (perm && !auth.hasPermission(perm)) {
    el.style.display = 'none'
    // 确保元素彻底不可交互
    ;(el as HTMLButtonElement).disabled = true
  }
}

/** 注册全局指令 */
export function registerDirectives(app: App) {
  app.directive('permission', permission)
}
