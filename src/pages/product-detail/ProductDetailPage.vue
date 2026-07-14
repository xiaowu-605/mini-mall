<template>
  <div class="product-detail">
    <div class="product-detail__container">
      <a
        class="product-detail__back"
        @click="goBack"
      >
        ← 返回首页
      </a>

      <div
        v-if="loading"
        v-loading="loading"
        class="product-detail__loading"
      />

      <div
        v-else-if="notFound"
        class="product-detail__not-found"
      >
        <el-empty description="商品不存在" />
      </div>

      <div
        v-else-if="!product"
        class="product-detail__not-found"
      >
        <el-empty description="加载失败，请重试">
          <el-button
            type="primary"
            @click="loadProduct"
            >重新加载</el-button
          >
        </el-empty>
      </div>

      <template v-else>
        <div class="product-detail__card">
          <div class="product-detail__image-wrap">
            <img
              :src="product.image || '/placeholder.svg'"
              :alt="product.name"
            />
          </div>

          <div class="product-detail__info">
            <div>
              <el-tag
                size="small"
                type="info"
                >{{ product.category?.name || '未分类' }}</el-tag
              >
              <h1 class="product-detail__name">{{ product.name }}</h1>
            </div>

            <div class="product-detail__price-row">
              <span class="price">¥{{ product.price }}</span>
              <span class="note">含税包邮</span>
            </div>

            <div class="product-detail__stock">
              <span
                class="dot"
                :class="product.stock > 0 ? 'dot--in' : 'dot--out'"
              />
              <span
                class="text"
                :class="product.stock > 0 ? 'text--in' : 'text--out'"
              >
                {{
                  product.stock > 0
                    ? `有货（库存 ${product.stock} 件）`
                    : '已售罄'
                }}
              </span>
            </div>

            <div class="product-detail__desc">
              <h3>商品描述</h3>
              <p>{{ product.description || '暂无描述' }}</p>
            </div>

            <div class="product-detail__actions">
              <el-input-number
                v-model="quantity"
                :min="1"
                :max="product.stock"
                :disabled="product.stock === 0"
                size="large"
              />
              <el-button
                type="primary"
                size="large"
                :disabled="product.stock === 0"
                class="product-detail__add-btn"
                @click="addToCart"
              >
                加入购物车
              </el-button>
            </div>
          </div>
        </div>

        <!-- 猜你喜欢 -->
        <div
          v-if="recommendedProducts.length > 0"
          class="product-detail__recommend"
        >
          <h2 class="product-detail__recommend-title">猜你喜欢</h2>
          <div
            v-loading="loadingRecommendations"
            class="product-detail__recommend-grid"
          >
            <ProductCard
              v-for="item in recommendedProducts"
              :key="item.id"
              :product="item"
              replace
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProductById, getProducts } from '@/api/products'
import ProductCard from '@/components/product/ProductCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const product = ref<Product | null>(null)
let loading = ref(true)
let notFound = ref(false)
let quantity = ref(1)
let recommendedProducts = ref<Product[]>([])
let loadingRecommendations = ref(false)
/** 竞态令牌：每次发起推荐请求时自增，回调中比对以丢弃过期结果 */
let fetchToken = 0
/** 返回首页：有历史记录则后退（恢复滚动位置），否则跳转首页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

/** 路由参数变化时重新加载商品详情 */
watch(
  () => route.params.id,
  () => {
    window.scrollTo(0, 0)
    loadProduct()
  },
  { immediate: true },
)

/** 加载商品详情 */
async function loadProduct() {
  loading.value = true
  notFound.value = false
  try {
    const id = parseInt(route.params.id as string)
    if (Number.isNaN(id)) {
      notFound.value = true
      return
    }
    const res = await getProductById(id)
    product.value = res.data || null
    if (product.value) fetchRecommendations()
  } catch (e: any) {
    console.error('加载商品详情失败:', e)
    if (e.response?.status === 404) {
      notFound.value = true
    }
  } finally {
    loading.value = false
  }
}

/** 获取猜你喜欢推荐商品 */
async function fetchRecommendations() {
  if (!product.value) return
  const token = ++fetchToken
  loadingRecommendations.value = true
  try {
    const currentProductId = product.value.id
    const currentCategoryId = product.value.categoryId
    const fetchedIds = new Set<number>([currentProductId])
    const results: Product[] = []

    // 第一步：同分类商品
    if (currentCategoryId) {
      const res = await getProducts({
        categoryId: currentCategoryId,
        pageSize: 8,
      })
      if (token !== fetchToken) return // 竞态：后续请求已发起，丢弃本次结果
      const items = (res.data?.data || []).filter(
        (p: Product) => !fetchedIds.has(p.id),
      )
      for (const item of items) {
        if (results.length >= 8) break
        fetchedIds.add(item.id)
        results.push(item)
      }
    }

    // 第二步：不足 8 个，用全站商品补齐
    if (results.length < 8) {
      const shortage = 8 - results.length
      // 随机取一页增加变化
      const randomPage = Math.floor(Math.random() * 5) + 1
      const res = await getProducts({ pageSize: shortage, page: randomPage })
      if (token !== fetchToken) return // 竞态：丢弃本次结果
      const items = (res.data?.data || []).filter(
        (p: Product) => !fetchedIds.has(p.id),
      )
      for (const item of items) {
        if (results.length >= 8) break
        fetchedIds.add(item.id)
        results.push(item)
      }
    }

    if (token !== fetchToken) return // 竞态：丢弃本次结果
    recommendedProducts.value = results
  } catch (e) {
    if (token !== fetchToken) return // 竞态：丢弃本次错误
    console.error('获取推荐商品失败:', e)
    // 静默处理，不影响主内容
  } finally {
    if (token === fetchToken) loadingRecommendations.value = false
  }
}

/** 加入购物车 */
async function addToCart() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!product.value) return
  try {
    const addParams = { productId: product.value.id, quantity: quantity.value }
    await cart.add(addParams)
    ElMessage.success('已加入购物车')
  } catch (e) {
    console.error(e)
    // 错误提示已由拦截器统一处理
  }
}
</script>

<style lang="less" scoped>
.product-detail {
  background: @color-bg;

  &__container {
    max-width: 896px;
    margin: 0 auto;
    padding: @spacing-lg @spacing-md;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: @spacing-xs;
    font-size: 14px;
    color: @color-text-secondary;
    margin-bottom: @spacing-md;
    cursor: pointer;

    &:hover {
      color: @color-text;
    }
  }

  &__loading {
    padding: 80px 0;
  }

  &__not-found {
    padding: 80px 0;
  }

  &__card {
    display: grid;
    gap: @spacing-lg;
    background: @color-bg-white;
    border-radius: @radius-lg;
    box-shadow: @shadow-sm;
    padding: @spacing-lg;

    @media (min-width: @screen-md) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__image-wrap {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: @radius-lg;
    background: #f3f4f6;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: @spacing-md;
  }

  &__name {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
    margin-top: @spacing-sm;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: @spacing-sm;

    .price {
      font-size: 30px;
      font-weight: 700;
      color: @color-danger;
    }

    .note {
      font-size: 14px;
      color: @color-text-muted;
    }
  }

  &__stock {
    display: flex;
    align-items: center;
    gap: @spacing-sm;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &--in {
        background: @color-success;
      }

      &--out {
        background: @color-danger;
      }
    }

    .text {
      font-size: 14px;

      &--in {
        color: #16a34a;
      }

      &--out {
        color: @color-danger;
      }
    }
  }

  &__desc {
    flex: 1;

    h3 {
      font-size: 14px;
      font-weight: 500;
      color: @color-text;
      margin-bottom: @spacing-sm;
    }

    p {
      font-size: 14px;
      color: @color-text-secondary;
      line-height: 1.6;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: @spacing-md;
    padding-top: @spacing-md;
    border-top: 1px solid #e5e7eb;
  }

  &__add-btn {
    flex: 1;
  }

  &__recommend {
    margin-top: @spacing-xl;
  }

  &__recommend-title {
    font-size: 20px;
    font-weight: 600;
    color: @color-text;
    margin: 0 0 @spacing-md;
  }

  &__recommend-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: @spacing-md;
    min-height: 120px;

    @media (max-width: @screen-md) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
