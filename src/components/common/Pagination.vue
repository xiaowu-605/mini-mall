<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
    <!-- 上一页 -->
    <button
      :disabled="currentPage <= 1"
      class="rounded-md border px-3 py-1.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      @click="$emit('change', currentPage - 1)"
    >
      上一页
    </button>
    <!-- 页码 -->
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="[
        'rounded-md border px-3 py-1.5 text-sm transition',
        page === currentPage
          ? 'border-blue-500 bg-blue-500 text-white'
          : 'hover:bg-gray-50',
      ]"
      @click="$emit('change', page)"
    >
      {{ page }}
    </button>
    <!-- 下一页 -->
    <button
      :disabled="currentPage >= totalPages"
      class="rounded-md border px-3 py-1.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      @click="$emit('change', currentPage + 1)"
    >
      下一页
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

defineEmits<{
  change: [page: number]
}>()

// 计算可见页码（最多显示 5 个）
const visiblePages = computed(() => {
  const pages: number[] = []
  const max = 5
  let start = Math.max(1, props.currentPage - Math.floor(max / 2))
  const end = Math.min(props.totalPages, start + max - 1)

  if (end - start + 1 < max) {
    start = Math.max(1, end - max + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>
