<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      class="pagination__btn"
      :disabled="currentPage <= 1"
      @click="$emit('change', currentPage - 1)"
    >
      上一页
    </button>
    <button
      v-for="p in visiblePages"
      :key="p"
      :class="['pagination__btn', { 'pagination__btn--active': p === currentPage }]"
      @click="$emit('change', p)"
    >
      {{ p }}
    </button>
    <button
      class="pagination__btn"
      :disabled="currentPage >= totalPages"
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

<style lang="less" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: @spacing-sm;

  &__btn {
    border-radius: @radius-md;
    border: 1px solid @color-border;
    padding: 6px 12px;
    font-size: 14px;
    transition: background 0.15s;

    &:hover:not(:disabled) {
      background: #f9fafb;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--active {
      border-color: @color-primary;
      background: @color-primary;
      color: #fff;

      &:hover:not(:disabled) {
        background: @color-primary-hover;
      }
    }
  }
}
</style>
