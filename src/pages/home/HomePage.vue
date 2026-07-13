<template>
  <div class="home-page">
    <!-- 顶部搜索区 -->
    <div class="home-page__header">
      <div class="home-page__header-inner">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索商品..."
          :prefix-icon="Search"
          clearable
          size="large"
          @input="onSearch"
          @clear="clearSearch"
        />
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
          @click="selectCategory(null)"
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
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 加载中 -->
      <div
        v-if="loading"
        v-loading="loading"
        class="home-page__loading"
      />

      <!-- 加载失败 -->
      <div
        v-else-if="error"
        class="home-page__error"
      >
        <el-empty description="加载失败，请重试">
          <el-button
            type="primary"
            @click="loadProducts"
            >重新加载</el-button
          >
        </el-empty>
      </div>

      <!-- 商品网格 -->
      <div v-else-if="products.length > 0">
        <div class="home-page__grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>
        <div class="home-page__pagination">
          <Pagination
            :current-page="page"
            :total-pages="totalPages"
            @change="onPageChange"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="home-page__empty"
      >
        <el-empty description="暂无商品" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getProducts } from '@/api/products'
import { getCategories } from '@/api/categories'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/product/ProductCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import { createDebounce } from '@/utils/debounce'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref(false)
const page = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const activeCategory = ref<number | null>(null)

const debounce = createDebounce(300)
let initialLoadDone = false

/** 页面初始化：从 URL 恢复状态并加载数据 */
onMounted(async () => {
  initFromQuery()
  await loadCategories()
  initialLoadDone = true
  await loadProducts()
})

/** 监听分类变化 */
watch(activeCategory, () => {
  if (!initialLoadDone) return
  updateURL()
  loadProducts()
})

/** 从 URL 查询参数恢复搜索状态 */
function initFromQuery() {
  const q = route.query
  if (q.search) searchQuery.value = q.search as string
  if (q.categoryId) activeCategory.value = parseInt(q.categoryId as string)
  if (q.page) page.value = parseInt(q.page as string) || 1
}

/** 加载分类列表 */
async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

/** 加载商品列表 */
async function loadProducts() {
  loading.value = true
  error.value = false
  try {
    const productParams = {
      search: searchQuery.value || undefined,
      categoryId: activeCategory.value ?? undefined,
      page: page.value,
      pageSize: 8,
    }
    const res = await getProducts(productParams)
    products.value = res.data.data
    totalPages.value = res.data.totalPages
  } catch (e) {
    console.error('加载商品失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

/** 切换分类 */
function selectCategory(categoryId: number | null) {
  activeCategory.value = categoryId
  page.value = 1
}

/** 清除搜索 */
function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  updateURL()
  loadProducts()
}

/** 搜索防抖 */
function onSearch() {
  debounce(() => {
    page.value = 1
    updateURL()
    loadProducts()
  })
}

/** 翻页 */
function onPageChange(newPage: number) {
  page.value = newPage
  updateURL()
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 同步筛选参数到 URL */
function updateURL() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (activeCategory.value) query.categoryId = String(activeCategory.value)
  if (page.value > 1) query.page = String(page.value)
  router.replace({ query })
}
</script>

<style lang="less" scoped>
.home-page {
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
    padding: 80px 0;
  }

  &__empty {
    padding: 60px 0;
  }
}
</style>
