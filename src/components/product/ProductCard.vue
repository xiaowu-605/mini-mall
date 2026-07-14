<template>
  <router-link
    :to="`/products/${product.id}`"
    :replace="replace"
    class="product-card"
  >
    <el-card
      :body-style="{ padding: '0' }"
      shadow="hover"
    >
      <div class="product-card__image">
        <img
          :src="product.image || '/placeholder.svg'"
          :alt="product.name"
        />
      </div>
      <div class="product-card__info">
        <el-tag
          size="small"
          type="info"
          >{{ product.category?.name || '未分类' }}</el-tag
        >
        <h3 class="product-card__name">{{ product.name }}</h3>
        <div class="product-card__footer">
          <span class="product-card__price">¥{{ product.price }}</span>
          <span
            v-if="product.stock === 0"
            class="product-card__stock--sold-out"
            >已售罄</span
          >
          <span
            v-else
            class="product-card__stock"
            >库存 {{ product.stock }}</span
          >
        </div>
      </div>
    </el-card>
  </router-link>
</template>

<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product
  replace?: boolean
}>()
</script>

<style lang="less" scoped>
.product-card {
  display: block;

  :deep(.el-card) {
    border-radius: @radius-lg;
  }

  &__image {
    aspect-ratio: 1;
    overflow: hidden;
    background: #f3f4f6;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s;
    }
  }

  &:hover &__image img {
    transform: scale(1.05);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: @spacing-xs;
    padding: @spacing-md;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: @color-text;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: @spacing-sm;
  }

  &__price {
    font-size: 18px;
    font-weight: 700;
    color: @color-danger;
  }

  &__stock {
    font-size: 12px;
    color: @color-text-muted;

    &--sold-out {
      font-size: 12px;
      color: @color-text-muted;
    }
  }
}
</style>
