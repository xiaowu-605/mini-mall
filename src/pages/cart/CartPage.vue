<template>
  <div class="cart-page">
    <h1 class="cart-page__title">购物车</h1>

    <!-- 加载中 -->
    <div v-if="cart.loading" class="cart-page__loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空购物车 -->
    <div v-else-if="!cart.items.length" class="cart-page__empty">
      <el-empty description="购物车是空的">
        <el-button type="primary" @click="goHome">去逛逛</el-button>
      </el-empty>
    </div>

    <!-- 购物车列表 -->
    <template v-else>
      <div class="cart-page__list">
        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <!-- 商品图片 -->
          <div class="cart-item__image">
            <img v-if="item.product?.image" :src="item.product.image" :alt="item.product.name" />
            <el-icon v-else :size="48"><Goods /></el-icon>
          </div>

          <!-- 商品信息 -->
          <div class="cart-item__info">
            <router-link :to="`/products/${item.product?.id}`" class="cart-item__name">
              {{ item.product?.name }}
            </router-link>
            <span class="cart-item__price">¥{{ item.product?.price?.toFixed(2) }}</span>
          </div>

          <!-- 数量控制 -->
          <div class="cart-item__quantity">
            <el-button size="small" :disabled="item.quantity <= 1" @click="handleDecrease(item)">
              -
            </el-button>
            <span class="cart-item__quantity-num">{{ item.quantity }}</span>
            <el-button
              size="small"
              :disabled="item.quantity >= (item.product?.stock || 0)"
              @click="handleIncrease(item)"
            >
              +
            </el-button>
          </div>

          <!-- 小计 -->
          <span class="cart-item__subtotal">
            ¥{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}
          </span>

          <!-- 删除 -->
          <el-button
            class="cart-item__delete"
            type="danger"
            size="small"
            @click="handleRemove(item)"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 底部合计 -->
      <div class="cart-page__footer">
        <span class="cart-page__total">
          合计：<strong>¥{{ cart.totalPrice.toFixed(2) }}</strong>
        </span>
        <el-button type="primary" size="large" @click="handleSubmit"> 提交订单 </el-button>
      </div>
    </template>

    <!-- 下单弹窗 -->
    <el-dialog v-model="dialogVisible" title="确认订单信息" width="450px">
      <el-form ref="formRef" :model="checkoutForm" :rules="checkoutRules" label-width="80px">
        <el-form-item label="收货地址" prop="address">
          <el-input v-model="checkoutForm.address" placeholder="请输入收货地址" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="checkoutForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doCreateOrder">确认下单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Loading, Goods } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { createOrder } from '@/api/orders'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import type { CartItem } from '@/types'

const router = useRouter()
const cart = useCartStore()
const { confirm: confirmDelete } = useDeleteConfirm()
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const checkoutForm = reactive({
  address: '',
  phone: '',
})

const checkoutRules: FormRules = {
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

/** 页面初始化：获取购物车数据 */
onMounted(() => {
  cart.fetchCart()
})

/** 返回首页 */
function goHome() {
  router.push('/')
}

/** 增加商品数量 */
async function handleIncrease(item: CartItem) {
  const newQuantity = item.quantity + 1
  const params = { quantity: newQuantity }
  try {
    await cart.updateQuantity(item.id, params)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

/** 减少商品数量 */
async function handleDecrease(item: CartItem) {
  const newQuantity = item.quantity - 1
  const params = { quantity: newQuantity }
  try {
    await cart.updateQuantity(item.id, params)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

/** 删除购物车项 */
async function handleRemove(item: CartItem) {
  await confirmDelete({
    message: `确认从购物车中删除「${item.product?.name}」？`,
    onDelete: () => cart.remove(item.id),
  })
}

/** 打开下单弹窗 */
function handleSubmit() {
  checkoutForm.address = ''
  checkoutForm.phone = ''
  dialogVisible.value = true
}

/** 提交订单 */
async function doCreateOrder() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const orderParams = { address: checkoutForm.address, phone: checkoutForm.phone }
    const res = await createOrder(orderParams)
    if (!res.data?.id) {
      ElMessage.error('下单失败')
      return
    }
    dialogVisible.value = false
    ElMessage.success('下单成功')
    cart.fetchCart()
    router.push(`/orders/${res.data.id}`)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '下单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="less" scoped>
.cart-page {
  max-width: 960px;
  margin: 0 auto;
  padding: @spacing-lg;

  &__title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: @spacing-lg;
    color: @color-text;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: @spacing-sm;
    padding: 80px 0;
    color: @color-text-secondary;
    font-size: 14px;
  }

  &__empty {
    padding: 80px 0;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: @spacing-lg;
    padding: @spacing-lg;
    margin-top: @spacing-lg;
    background: @color-bg-white;
    border-radius: @radius-md;
    box-shadow: @shadow-sm;
  }

  &__total {
    font-size: 18px;
    color: @color-text;

    strong {
      color: @color-danger;
      font-size: 22px;
    }
  }
}

.cart-item {
  display: flex;
  align-items: center;
  gap: @spacing-md;
  padding: @spacing-md;
  margin-bottom: @spacing-sm;
  background: @color-bg-white;
  border-radius: @radius-md;
  box-shadow: @shadow-sm;

  &__image {
    width: 80px;
    height: 80px;
    border-radius: @radius-sm;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 14px;
    color: @color-text;
    margin-bottom: @spacing-xs;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      color: @color-primary;
    }
  }

  &__price {
    font-size: 13px;
    color: @color-text-secondary;
  }

  &__quantity {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;

    &-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      font-size: 14px;
      color: @color-text;
    }
  }

  &__subtotal {
    font-size: 15px;
    font-weight: 500;
    color: @color-danger;
    min-width: 100px;
    text-align: right;
    flex-shrink: 0;
  }

  &__delete {
    flex-shrink: 0;
  }
}
</style>
