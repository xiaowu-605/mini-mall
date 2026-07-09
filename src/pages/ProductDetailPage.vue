<template>
  <div class="product-detail">
    <div class="product-detail__container">
      <router-link to="/" class="product-detail__back"> ← 返回首页 </router-link>

      <div v-if="loading" class="product-detail__loading"><span>加载中...</span></div>

      <div v-else-if="!product" class="product-detail__not-found">
        <span>🔍</span>
        <p>商品不存在</p>
      </div>

      <template v-else>
        <div class="product-detail__card">
          <div class="product-detail__image-wrap">
            <img :src="product.image || '/placeholder.svg'" :alt="product.name" />
          </div>

          <div class="product-detail__info">
            <div>
              <span class="product-detail__category-tag">{{
                product.category?.name || '未分类'
              }}</span>
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
              <div class="product-detail__qty">
                <button :disabled="quantity <= 1" @click="quantity--">−</button>
                <span>{{ quantity }}</span>
                <button :disabled="quantity >= product.stock" @click="quantity++">+</button>
              </div>
              <button
                class="product-detail__add-btn"
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
  showCartTip.value = true
  setTimeout(() => {
    showCartTip.value = false
  }, 1500)
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

  &__not-found {
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

  &__category-tag {
    display: inline-block;
    font-size: 12px;
    color: @color-text-secondary;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: @radius-sm;
    width: fit-content;
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

  &__qty {
    display: flex;
    align-items: center;
    border: 1px solid @color-border;
    border-radius: @radius-lg;

    button {
      padding: 8px 12px;
      color: @color-text-secondary;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #f3f4f6;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    span {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      min-width: 48px;
      text-align: center;
    }
  }

  &__add-btn {
    flex: 1;
    border-radius: @radius-lg;
    background: @color-primary;
    padding: 12px 24px;
    color: #fff;
    font-weight: 500;
    transition: background 0.15s;

    &:hover:not(:disabled) {
      background: @color-primary-hover;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
