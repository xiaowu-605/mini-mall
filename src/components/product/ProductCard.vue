<template>
  <router-link
    :to="`/products/${product.id}`"
    class="group rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md overflow-hidden flex flex-col"
  >
    <!-- 商品图片 -->
    <div class="aspect-square overflow-hidden bg-gray-100">
      <img
        :src="product.image || '/placeholder.svg'"
        :alt="product.name"
        class="h-full w-full object-cover transition group-hover:scale-105"
      />
    </div>
    <!-- 商品信息 -->
    <div class="flex flex-col gap-1.5 p-4 flex-1">
      <span class="text-xs text-gray-500">{{ product.category?.name || '未分类' }}</span>
      <h3 class="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
        {{ product.name }}
      </h3>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="text-lg font-bold text-red-500">¥{{ product.price }}</span>
        <span v-if="product.stock === 0" class="text-xs text-gray-400">已售罄</span>
        <span v-else class="text-xs text-gray-400">库存 {{ product.stock }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product
}>()
</script>
