<template>
  <div class="home-page">
    <!-- 顶部搜索区 -->
    <div class="home-page__header">
      <div class="home-page__header-inner">
        <h1 class="home-page__title">Mini-Mall</h1>
        <!-- 搜索框 -->
        <div class="home-page__search">
          <span class="home-page__search-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索商品..."
            class="home-page__search-input"
            @input="onSearch"
          />
          <button v-if="searchQuery" class="home-page__search-clear" @click="clearSearch">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="home-page__body">
      <!-- 分类标签 -->
      <div class="home-page__categories">
        <button
          :class="[
            'home-page__category-btn',
            { 'home-page__category-btn--active': activeCategory === null },
          ]"
          @click="((activeCategory = null), (page = 1))"
        >
          全部
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'home-page__category-btn',
            { 'home-page__category-btn--active': activeCategory === cat.id },
          ]"
          @click="((activeCategory = cat.id), (page = 1))"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="home-page__loading"><span>加载中...</span></div>

      <!-- 商品网格 -->
      <div v-else-if="products.length > 0">
        <div class="home-page__grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
        <div class="home-page__pagination">
          <Pagination :current-page="page" :total-pages="totalPages" @change="onPageChange" />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="home-page__empty">
        <span>📦</span>
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

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const activeCategory = ref<number | null>(null)

let debounceTimer: ReturnType<typeof setTimeout>

function initFromQuery() {
  const q = route.query
  if (q.search) searchQuery.value = q.search as string
  if (q.categoryId) activeCategory.value = parseInt(q.categoryId as string)
  if (q.page) page.value = parseInt(q.page as string) || 1
}

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

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

function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  updateURL()
  loadProducts()
}

function onSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    updateURL()
    loadProducts()
  }, 300)
}

function onPageChange(newPage: number) {
  page.value = newPage
  updateURL()
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updateURL() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (activeCategory.value) query.categoryId = String(activeCategory.value)
  if (page.value > 1) query.page = String(page.value)
  router.replace({ query })
}

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

<style lang="less" scoped>
.home-page {
  min-height: 100vh;
  background: @color-bg;

  &__header {
    background: @color-bg-white;
    box-shadow: @shadow-sm;
    padding: @spacing-lg @spacing-md;
  }

  &__header-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
    margin-bottom: @spacing-md;
  }

  &__search {
    position: relative;
  }

  &__search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: @color-text-muted;
    pointer-events: none;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__search-input {
    width: 100%;
    border-radius: @radius-lg;
    border: 1px solid @color-border;
    padding: 10px 40px;
    font-size: 14px;
    outline: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &:focus {
      border-color: @color-primary;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }
  }

  &__search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: @color-text-muted;
    padding: 2px;

    &:hover {
      color: @color-text-secondary;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__body {
    max-width: 1280px;
    margin: 0 auto;
    padding: @spacing-lg @spacing-md;
  }

  &__categories {
    display: flex;
    flex-wrap: wrap;
    gap: @spacing-sm;
    margin-bottom: @spacing-lg;
  }

  &__category-btn {
    border-radius: @radius-full;
    padding: 6px 16px;
    font-size: 14px;
    transition: all 0.15s;
    background: @color-bg-white;
    color: @color-text-secondary;
    border: 1px solid @color-border;

    &:hover {
      background: #f3f4f6;
    }

    &--active {
      background: @color-primary;
      color: #fff;
      border-color: @color-primary;

      &:hover {
        background: @color-primary-hover;
      }
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: @spacing-md;

    @media (min-width: @screen-sm) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: @screen-md) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__pagination {
    margin-top: @spacing-xl;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: @color-text-secondary;
    gap: @spacing-sm;

    &::before {
      content: '';
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 4px solid #e5e7eb;
      border-top-color: @color-primary;
      animation: spin 0.8s linear infinite;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: @color-text-muted;

    span {
      font-size: 48px;
      margin-bottom: @spacing-md;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
