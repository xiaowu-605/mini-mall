<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-4xl px-4 py-6">
      <!-- 返回 -->
      <router-link
        to="/"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← 返回首页
      </router-link>

      <!-- 加载中 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        <span class="ml-3 text-gray-500">加载中...</span>
      </div>

      <!-- 商品不存在 -->
      <div
        v-else-if="!product"
        class="flex flex-col items-center justify-center py-20 text-gray-400"
      >
        <span class="text-5xl mb-4">🔍</span>
        <p>商品不存在</p>
      </div>

      <!-- 商品详情 -->
      <template v-else>
        <div class="grid gap-6 md:grid-cols-2 bg-white rounded-lg shadow-sm p-6">
          <!-- 商品图片 -->
          <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img
              :src="product.image || '/placeholder.svg'"
              :alt="product.name"
              class="h-full w-full object-cover"
            />
          </div>

          <!-- 商品信息 -->
          <div class="flex flex-col gap-4">
            <div>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {{ product.category?.name || '未分类' }}
              </span>
              <h1 class="mt-2 text-2xl font-bold text-gray-900">{{ product.name }}</h1>
            </div>

            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold text-red-500">¥{{ product.price }}</span>
              <span class="text-sm text-gray-400">含税包邮</span>
            </div>

            <!-- 库存状态 -->
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'inline-block h-2 w-2 rounded-full',
                  product.stock > 0 ? 'bg-green-500' : 'bg-red-500',
                ]"
              />
              <span class="text-sm" :class="product.stock > 0 ? 'text-green-600' : 'text-red-500'">
                {{ product.stock > 0 ? `有货（库存 ${product.stock} 件）` : '已售罄' }}
              </span>
            </div>

            <!-- 描述 -->
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-700 mb-2">商品描述</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                {{ product.description || '暂无描述' }}
              </p>
            </div>

            <!-- 数量选择 + 加入购物车 -->
            <div class="flex items-center gap-4 pt-4 border-t">
              <div class="flex items-center border rounded-lg">
                <button
                  class="px-3 py-2 text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
                  :disabled="quantity <= 1"
                  @click="quantity--"
                >
                  −
                </button>
                <span class="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                  {{ quantity }}
                </span>
                <button
                  class="px-3 py-2 text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
                  :disabled="quantity >= product.stock"
                  @click="quantity++"
                >
                  +
                </button>
              </div>
              <button
                class="flex-1 rounded-lg bg-blue-500 px-6 py-3 text-white font-medium transition hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="product.stock === 0"
                @click="addToCart"
              >
                {{ showCartTip ? '已加入购物车 ✓' : '加入购物车' }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProductById } from '@/api/products'
import type { Product } from '@/types'

const route = useRoute()
const product = ref<Product | null>(null)
const loading = ref(true)
const quantity = ref(1)
const showCartTip = ref(false)

async function loadProduct() {
  loading.value = true
  try {
    const id = parseInt(route.params.id as string)
    const res = await getProductById(id)
    product.value = res.data
  } catch (e) {
    console.error('加载商品详情失败:', e)
  } finally {
    loading.value = false
  }
}

function addToCart() {
  // TODO: 后续接入购物车 Store
  showCartTip.value = true
  setTimeout(() => {
    showCartTip.value = false
  }, 1500)
}

onMounted(() => {
  loadProduct()
})
</script>
