<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部搜索区 -->
    <div class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Mini-Mall</h1>
        <!-- 搜索框 -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索商品..."
            class="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="onSearch"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="clearSearch"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 py-6">
      <!-- 分类标签 -->
      <div class="mb-6 flex flex-wrap gap-2">
        <button
          :class="[
            'rounded-full px-4 py-1.5 text-sm transition',
            activeCategory === null
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200',
          ]"
          @click="activeCategory = null; page = 1"
        >
          全部
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'rounded-full px-4 py-1.5 text-sm transition',
            activeCategory === cat.id
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200',
          ]"
          @click="activeCategory = cat.id; page = 1"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        <span class="ml-3 text-gray-500">加载中...</span>
      </div>

      <!-- 商品网格 -->
      <div v-else-if="products.length > 0">
        <div
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>

        <!-- 分页 -->
        <div class="mt-8">
          <Pagination
            :current-page="page"
            :total-pages="totalPages"
            @change="onPageChange"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
        <span class="text-5xl mb-4">📦</span>
        <p>暂无商品</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducts } from '@/api/products'
import { getCategories } from '@/api/categories'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/product/ProductCard.vue'
import Pagination from '@/components/common/Pagination.vue'

const route = useRoute()
const router = useRouter()

// 状态
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const activeCategory = ref<number | null>(null)

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout>

// 从 URL 恢复状态
function initFromQuery() {
  const q = route.query
  if (q.search) searchQuery.value = q.search as string
  if (q.categoryId) activeCategory.value = parseInt(q.categoryId as string)
  if (q.page) page.value = parseInt(q.page as string) || 1
}

// 加载分类
async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

// 加载商品
async function loadProducts() {
  loading.value = true
  try {
    const res = await getProducts({
      search: searchQuery.value || undefined,
      categoryId: activeCategory.value ?? undefined,
      page: page.value,
      pageSize: 9,
    })
    products.value = res.data.data
    totalPages.value = res.data.totalPages
  } catch (e) {
    console.error('加载商品失败:', e)
  } finally {
    loading.value = false
  }
}

// 清除搜索
function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  updateURL()
  loadProducts()
}

// 搜索（防抖 300ms）
function onSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    updateURL()
    loadProducts()
  }, 300)
}

// 翻页
function onPageChange(newPage: number) {
  page.value = newPage
  updateURL()
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 同步 URL 参数
function updateURL() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (activeCategory.value) query.categoryId = String(activeCategory.value)
  if (page.value > 1) query.page = String(page.value)
  router.replace({ query })
}

// 监听分类变化
watch(activeCategory, () => {
  updateURL()
  loadProducts()
})

onMounted(async () => {
  initFromQuery()
  await loadCategories()
  await loadProducts()
})
</script>
