/** 格式化 ISO 时间为本地中文显示 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN')
}
