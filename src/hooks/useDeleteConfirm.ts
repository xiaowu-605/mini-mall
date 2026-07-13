import { ElMessage, ElMessageBox } from 'element-plus'

/** 删除确认 hook：弹出确认框 → 执行删除 → 错误处理 */
export function useDeleteConfirm() {
  /** 弹出确认后执行删除回调 */
  async function confirm(options: {
    message: string
    title?: string
    onDelete: () => Promise<any>
    onSuccess?: () => void
  }): Promise<void> {
    try {
      await ElMessageBox.confirm(options.message, options.title || '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
    } catch {
      // 用户取消
      return
    }

    try {
      await options.onDelete()
      ElMessage.success('已删除')
      options.onSuccess?.()
    } catch (e) {
      console.error(e)
      // 错误提示已由拦截器统一处理
    }
  }

  return { confirm }
}
