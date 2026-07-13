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
            @click="loadProducts"
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

      <!-- 虚拟滚动：每行独立 absolute 定位，行之间互不影响 -->
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getProducts } from '@/api/products'
import { getCategories } from '@/api/categories'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/product/ProductCard.vue'
import { createDebounce } from '@/utils/debounce'
import { useVirtualGrid } from '@/hooks/useVirtualGrid'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref(false)
const searchQuery = ref('')
const activeCategory = ref<number | null>(null)

const debounce = createDebounce(300)
let initialLoadDone = false

const stickyHeight = ref(200)

const {
  containerRef,
  itemsPerRow,
  totalHeight,
  visibleRows,
  rowHeight,
  getRowItems,
  calibrate,
  updateGridTop,
} = useVirtualGrid(products, {
  stickyOffset: stickyHeight,
})

onMounted(async () => {
  const stickyEl = document.querySelector('.home-page__sticky') as HTMLElement | null
  if (stickyEl) {
    stickyHeight.value = stickyEl.offsetHeight + 56
  }

  initFromQuery()
  await loadCategories()
  initialLoadDone = true
  await loadProducts()

  // 等 DOM 渲染 + 浏览器布局完成后再实测行高
  await nextTick()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  calibrate()
})

watch(activeCategory, () => {
  if (!initialLoadDone) return
  updateURL()
  loadProducts()
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

async function loadProducts() {
  loading.value = true
  error.value = false
  try {
    const productParams = {
      search: searchQuery.value || undefined,
      categoryId: activeCategory.value ?? undefined,
      page: 1,
      pageSize: 1000,
    }
    const res = await getProducts(productParams)
    products.value = res.data.data || []
    updateGridTop()
  } catch (e) {
    console.error('加载商品失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
  await nextTick()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  calibrate()
}

function selectCategory(categoryId: number | null) {
  activeCategory.value = categoryId
}

function clearSearch() {
  searchQuery.value = ''
  updateURL()
  loadProducts()
}

function onSearch() {
  debounce(() => {
    updateURL()
    loadProducts()
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

  /* 虚拟滚动容器 */
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
    /* grid-template-columns 由 JS 根据容器宽度动态设置 */
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
}
</style>
