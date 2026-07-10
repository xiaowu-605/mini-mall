<template>
  <div class="product-detail">
    <div class="product-detail__container">
      <router-link to="/" class="product-detail__back"> ← 返回首页 </router-link>

      <div v-if="loading" v-loading="loading" class="product-detail__loading" />

      <div v-else-if="!product" class="product-detail__not-found">
        <el-empty description="商品不存在" />
      </div>

      <template v-else>
        <div class="product-detail__card">
          <div class="product-detail__image-wrap">
            <img :src="product.image || '/placeholder.svg'" :alt="product.name" />
          </div>

          <div class="product-detail__info">
            <div>
              <el-tag size="small" type="info">{{ product.category?.name || '未分类' }}</el-tag>
              <h1 class="product-detail__name">{{ product.name }}</h1>
            </div>

            <div class="product-detail__price-row">
              <span class="price">¥{{ product.price }}</span>
              <span class="note">含税包邮</span>
            </div>

            <div class="product-detail__stock">
              <span class="dot" :class="product.stock > 0 ? 'dot--in' : 'dot--out'" />
              <span class="text" :class="product.stock > 0 ? 'text--in' : 'text--out'">
                {{ product.stock > 0 ? `有货（库存 ${product.stock} 件）` : '已售罄' }}
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
                {{ showCartTip ? '已加入购物车 ✓' : '加入购物车' }}
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProductById } from '@/api/products'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
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

async function addToCart() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!product.value) return
  try {
    await cart.add({ productId: product.value.id, quantity: quantity.value })
    showCartTip.value = true
    setTimeout(() => {
      showCartTip.value = false
    }, 1500)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '加入购物车失败')
  }
}

onMounted(() => {
  loadProduct()
})
</script>

<style lang="less" scoped>
.product-detail {
  min-height: 100vh;
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
}
</style>
