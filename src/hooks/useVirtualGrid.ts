import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  toValue,
  type Ref,
  type MaybeRef,
} from 'vue'

/**
 * 虚拟网格滚动 composable
 * 每行独立 absolute 定位，行间无相互影响
 */
export function useVirtualGrid(
  items: Ref<readonly any[]>,
  options: {
    estimatedInfoHeight?: number
    overscan?: number
    stickyOffset?: MaybeRef<number>
  } = {},
) {
  const estimatedInfoHeight = options.estimatedInfoHeight ?? 140
  const overscan = options.overscan ?? 4
  const gap = 16

  const containerRef = ref<HTMLElement | null>(null)
  // 初始宽度设为 0，由 ResizeObserver/setupObserver 立即矫正，避免布局跳动
  const containerWidth = ref(0)
  const scrollY = ref(0)
  const viewportHeight = ref(window.innerHeight)
  const measuredRowHeight = ref(0)

  /** 列数（基于容器实际宽度，初始用 window 宽度估算） */
  const itemsPerRow = computed(() => {
    if (containerWidth.value >= 768) return 4
    if (containerWidth.value >= 640) return 3
    return 2
  })

  const itemWidth = computed(() => {
    const n = itemsPerRow.value
    return (containerWidth.value - (n - 1) * gap) / n
  })

  const estimatedRowHeight = computed(
    () => itemWidth.value + estimatedInfoHeight + gap,
  )

  const rowHeight = computed(
    () => measuredRowHeight.value || estimatedRowHeight.value,
  )

  const totalRows = computed(() =>
    Math.ceil(items.value.length / itemsPerRow.value),
  )

  const totalHeight = computed(() => totalRows.value * rowHeight.value)

  const gridTop = ref(0)

  function updateGridTop() {
    if (containerRef.value) {
      gridTop.value =
        containerRef.value.getBoundingClientRect().top + window.scrollY
    }
  }

  const startRow = computed(() => {
    const offset = toValue(options.stickyOffset) ?? 0
    const visibleTop = Math.max(0, scrollY.value + offset - gridTop.value)
    return Math.max(0, Math.floor(visibleTop / rowHeight.value) - overscan)
  })

  const endRow = computed(() => {
    const visibleBot = Math.max(
      0,
      scrollY.value + viewportHeight.value - gridTop.value,
    )
    return Math.min(
      totalRows.value,
      Math.ceil(visibleBot / rowHeight.value) + overscan,
    )
  })

  const visibleRows = computed(() => {
    const rows: number[] = []
    for (let i = startRow.value; i < endRow.value; i++) rows.push(i)
    return rows
  })

  function getRowItems(rowIdx: number) {
    const start = rowIdx * itemsPerRow.value
    return items.value.slice(start, start + itemsPerRow.value) as any[]
  }

  /** 是否滚动到了已加载数据的底部附近（需要加载更多） */
  const nearEnd = computed(
    () => totalRows.value > 0 && endRow.value >= totalRows.value - 3,
  )

  /** 实测行高：取前两行间距 */
  function calibrate() {
    if (!containerRef.value) return
    const rows = containerRef.value.querySelectorAll('[data-vgrid-row]')
    if (rows.length < 2) return
    const h =
      (rows[1] as HTMLElement).offsetTop - (rows[0] as HTMLElement).offsetTop
    if (h > 20) measuredRowHeight.value = h
  }

  /* ---- ResizeObserver（等待 containerRef 可用后才启动） ---- */

  let resizeObserver: ResizeObserver | null = null
  let scrollRaf = 0

  function setupObserver() {
    if (!containerRef.value) return
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
      updateGridTop()
    })
    resizeObserver.observe(containerRef.value)
    // 立即同步当前宽度
    containerWidth.value = containerRef.value.clientWidth
  }

  function teardownObserver() {
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  /** 监听 containerRef 绑定，绑定后启动 ResizeObserver */
  watch(containerRef, (el) => {
    if (el) {
      setupObserver()
    } else {
      teardownObserver()
    }
  })

  function onScroll() {
    if (scrollRaf) return
    scrollRaf = requestAnimationFrame(() => {
      scrollY.value = window.scrollY
      viewportHeight.value = window.innerHeight
      scrollRaf = 0
    })
  }

  function onResize() {
    viewportHeight.value = window.innerHeight
    updateGridTop()
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    scrollY.value = window.scrollY
    updateGridTop()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    teardownObserver()
    if (scrollRaf) cancelAnimationFrame(scrollRaf)
  })

  return {
    containerRef,
    itemsPerRow,
    rowHeight,
    totalHeight,
    totalRows,
    visibleRows,
    nearEnd,
    getRowItems,
    calibrate,
    updateGridTop,
  }
}
