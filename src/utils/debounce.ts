/** 创建防抖函数 */
export function createDebounce(delay = 300) {
  let timer: ReturnType<typeof setTimeout>
  // 返回包装函数
  return (fn: () => void) => {
    clearTimeout(timer)
    timer = setTimeout(fn, delay)
  }
}
