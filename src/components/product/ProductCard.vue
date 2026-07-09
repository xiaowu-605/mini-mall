<template>
  <router-link :to="`/products/${product.id}`" class="product-card">
    <div class="product-card__image">
      <img :src="product.image || '/placeholder.svg'" :alt="product.name" />
    </div>
    <div class="product-card__info">
      <span class="product-card__category">{{ product.category?.name || '未分类' }}</span>
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__footer">
        <span class="product-card__price">¥{{ product.price }}</span>
        <span v-if="product.stock === 0" class="product-card__stock product-card__stock--sold-out"
          >已售罄</span
        >
        <span v-else class="product-card__stock">库存 {{ product.stock }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product
}>()
</script>

<style lang="less" scoped>
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: @radius-lg;
  border: 1px solid @color-border;
  background: @color-bg-white;
  box-shadow: @shadow-sm;
  transition: box-shadow 0.2s;
  overflow: hidden;

  &:hover {
    box-shadow: @shadow-md;
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
    flex: 1;
  }

  &__category {
    font-size: 12px;
    color: @color-text-secondary;
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
      color: @color-text-muted;
    }
  }
}
</style>
