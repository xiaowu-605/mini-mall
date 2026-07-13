<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Logo -->
      <router-link
        to="/"
        class="app-header__logo"
        >Mini-Mall</router-link
      >

      <!-- 右侧导航 -->
      <div class="app-header__nav">
        <router-link
          to="/cart"
          class="app-header__link"
        >
          <el-icon><ShoppingCart /></el-icon>
          <span>购物车</span>
          <el-badge
            v-if="auth.isLoggedIn && cart.count > 0"
            :value="cart.count"
            class="app-header__badge"
          />
        </router-link>

        <router-link
          to="/orders"
          class="app-header__link"
        >
          <el-icon><Tickets /></el-icon>
          <span>我的订单</span>
        </router-link>

        <!-- 未登录 -->
        <template v-if="!auth.isLoggedIn">
          <router-link
            to="/login"
            class="app-header__link"
          >
            <el-icon><User /></el-icon>
            <span>登录</span>
          </router-link>
        </template>

        <!-- 已登录 -->
        <template v-else>
          <el-dropdown
            trigger="click"
            @command="onCommand"
          >
            <span class="app-header__user">
              <el-icon><UserFilled /></el-icon>
              <span>{{ auth.user?.name }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item
                  v-if="auth.isAdmin"
                  command="admin"
                  >后台管理</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="logout"
                  >退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { watch } from 'vue'
import { ShoppingCart, Tickets, User, UserFilled, ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()

/** 登录后自动获取购物车数量 */
watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      cart.fetchCart()
    }
  },
  { immediate: true },
)

/** 处理下拉菜单命令 */
function onCommand(cmd: string) {
  if (cmd === 'orders') {
    router.push('/orders')
  } else if (cmd === 'admin') {
    router.push('/admin')
  } else if (cmd === 'logout') {
    auth.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }
}
</script>

<style lang="less" scoped>
.app-header {
  background: @color-bg-white;
  box-shadow: @shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;

  &__inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 @spacing-md;
    height: 56px;
  }

  &__logo {
    font-size: 20px;
    font-weight: 700;
    color: @color-primary;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: @spacing-md;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: @spacing-xs;
    font-size: 14px;
    color: @color-text-secondary;
    padding: @spacing-xs @spacing-sm;
    border-radius: @radius-md;
    transition: all 0.15s;

    &:hover {
      color: @color-primary;
      background: #eff6ff;
    }
  }

  &__user {
    display: flex;
    align-items: center;
    gap: @spacing-xs;
    font-size: 14px;
    color: @color-text;
    cursor: pointer;
    padding: @spacing-xs @spacing-sm;
    border-radius: @radius-md;

    &:hover {
      background: #f3f4f6;
    }
  }
}
</style>
