<template>
  <div
    v-if="totalPages > 1"
    class="pagination-wrap"
  >
    <el-pagination
      :current-page="currentPage"
      :page-size="1"
      :total="totalPages"
      background
      layout="prev, pager, next"
      @current-change="$emit('change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

defineEmits<{
  change: [page: number]
}>()
</script>

<style lang="less" scoped>
.pagination-wrap {
  display: flex;
  justify-content: center;
}
</style>
