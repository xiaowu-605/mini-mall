/** 格式化 ISO 时间为本地中文显示 */
export function formatTime(iso: string): string {
  if (!iso) return '--'
  const date = new Date(iso)
  // 校验日期合法性，避免向用户展示 "Invalid Date"
  if (isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN')
}
