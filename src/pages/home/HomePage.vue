<template>
  <div class="home-page">
    <!-- 搜索 + 分类置顶区域 -->
    <div class="home-page__sticky">
      <div class="home-page__header">
        <div class="home-page__header-inner">
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
    </div>

    <div class="home-page__body">
      <div
        v-if="loading"
        v-loading="loading"
        class="home-page__loading"
      />
      <div
        v-else-if="error"
        class="home-page__error"
      >
        <el-empty description="加载失败，请重试">
          <el-button
            type="primary"
            @click="loadFirstPage"
          >
            重新加载
          </el-button>
        </el-empty>
      </div>
      <div
        v-else-if="products.length === 0"
        class="home-page__empty"
      >
        <el-empty description="暂无商品" />
      </div>

      <!-- 虚拟滚动 -->
      <div
        v-else
        ref="containerRef"
        class="home-page__vgrid"
        :style="{ height: totalHeight + 'px' }"
      >
        <div
          v-for="rowIdx in visibleRows"
          :key="rowIdx"
          data-vgrid-row
          class="home-page__vgrid-row"
          :style="{ top: rowIdx * rowHeight + 'px' }"
        >
          <div
            class="home-page__grid"
            :style="{ gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)` }"
          >
            <ProductCard
              v-for="item in getRowItems(rowIdx)"
              :key="item.id"
              :product="item"
            />
          </div>
        </div>

        <!-- 底部加载更多提示 -->
        <div
          v-if="loadingMore"
          class="home-page__more"
        >
          <span class="home-page__more-text">加载中…</span>
        </div>
      </div>
    </div>

    <!-- 返回顶部 -->
    <transition name="el-fade-in">
      <button
        v-show="showBackTop"
        class="home-page__back-top"
        @click="scrollToTop"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getProducts } from '@/api/products'
import { getCategories } from '@/api/categories'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/product/ProductCard.vue'
import { createDebounce } from '@/utils/debounce'
import { useVirtualGrid } from '@/hooks/useVirtualGrid'

const PAGE_SIZE = 50

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(false)
const searchQuery = ref('')
const activeCategory = ref<number | null>(null)

/** 分页状态 */
const currentPage = ref(1)
const hasMore = ref(true)

const debounce = createDebounce(300)
let initialLoadDone = false

const stickyHeight = ref(200)

const {
  containerRef,
  itemsPerRow,
  totalHeight,
  visibleRows,
  rowHeight,
  nearEnd,
  getRowItems,
  calibrate,
  updateGridTop,
} = useVirtualGrid(products, {
  stickyOffset: stickyHeight,
})

/** 滚动接近已加载数据底部时，自动加载下一页 */
watch(nearEnd, (val) => {
  if (val && hasMore.value && !loadingMore.value) {
    loadMore()
  }
})

// 返回顶部按钮显隐
const showBackTop = ref(false)
const BACK_TOP_THRESHOLD = 400

/** 监听滚动，控制返回顶部按钮显隐 */
function onBackTopScroll() {
  showBackTop.value = window.scrollY > BACK_TOP_THRESHOLD
}

/** 平滑滚动到页面顶部 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  const stickyEl = document.querySelector(
    '.home-page__sticky',
  ) as HTMLElement | null
  if (stickyEl) {
    stickyHeight.value = stickyEl.offsetHeight + 56
  }

  window.addEventListener('scroll', onBackTopScroll, { passive: true })

  initFromQuery()
  await loadCategories()
  initialLoadDone = true
  await loadFirstPage()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onBackTopScroll)
})

/** 筛选变化时重新加载 */
watch(activeCategory, () => {
  if (!initialLoadDone) return
  updateURL()
  loadFirstPage()
})

function initFromQuery() {
  const q = route.query
  if (q.search) searchQuery.value = q.search as string
  if (q.categoryId) activeCategory.value = parseInt(q.categoryId as string)
}

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

/** 首屏加载 / 筛选重置：清空旧数据，加载第 1 页 */
async function loadFirstPage() {
  loading.value = true
  error.value = false
  currentPage.value = 1
  hasMore.value = true
  try {
    const params = {
      search: searchQuery.value || undefined,
      categoryId: activeCategory.value ?? undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    }
    const res = await getProducts(params)
    products.value = res.data.data || []
    hasMore.value = currentPage.value < (res.data.totalPages || 1)
    updateGridTop()
  } catch (e) {
    console.error('加载商品失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
  await nextTick()
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  )
  calibrate()
}

/** 滚动加载下一页，追加到已有数据 */
async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const params = {
      search: searchQuery.value || undefined,
      categoryId: activeCategory.value ?? undefined,
      page: nextPage,
      pageSize: PAGE_SIZE,
    }
    const res = await getProducts(params)
    const newItems = res.data.data || []
    if (newItems.length > 0) {
      products.value.push(...newItems)
      currentPage.value = nextPage
      hasMore.value = nextPage < (res.data.totalPages || 1)
    } else {
      hasMore.value = false
    }
  } catch (e) {
    console.error('加载更多商品失败:', e)
  } finally {
    loadingMore.value = false
  }
}

function selectCategory(categoryId: number | null) {
  activeCategory.value = categoryId
}

function clearSearch() {
  searchQuery.value = ''
  updateURL()
  loadFirstPage()
}

function onSearch() {
  debounce(() => {
    updateURL()
    loadFirstPage()
  })
}

function updateURL() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (activeCategory.value) query.categoryId = String(activeCategory.value)
  router.replace({ query })
}
</script>

<style lang="less" scoped>
.home-page {
  background: @color-bg;

  &__sticky {
    position: sticky;
    top: 56px;
    z-index: 50;
    background: @color-bg;
    padding-bottom: @spacing-lg;
  }

  &__header {
    background: @color-bg-white;
    box-shadow: @shadow-sm;
    padding: @spacing-lg @spacing-md;
  }

  &__header-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  &__categories {
    display: flex;
    flex-wrap: wrap;
    gap: @spacing-sm;
    max-width: 1280px;
    margin: 0 auto;
    padding: @spacing-md @spacing-md 0;
  }

  &__category-btn {
    border-radius: @radius-full;
    padding: 6px 16px;
    font-size: 14px;
    transition: all 0.15s;
    background: @color-bg-white;
    color: @color-text-secondary;
    border: 1px solid @color-border;
    cursor: pointer;

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

  &__body {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 @spacing-md @spacing-2xl;
  }

  &__vgrid {
    position: relative;
  }

  &__vgrid-row {
    position: absolute;
    left: 0;
    right: 0;
  }

  &__grid {
    display: grid;
    gap: @spacing-md;
  }

  &__more {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: @spacing-lg 0;
  }

  &__more-text {
    font-size: 13px;
    color: @color-text-muted;
  }

  &__loading {
    padding: 80px 0;
  }

  &__error {
    padding: 60px 0;
  }

  &__empty {
    padding: 60px 0;
  }

  &__back-top {
    position: fixed;
    right: 24px;
    bottom: 40px;
    z-index: 100;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: @color-bg-white;
    border: 1px solid @color-border;
    box-shadow: @shadow-md;
    color: @color-text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      color: @color-primary;
      border-color: @color-primary;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }
  }
}
</style>
