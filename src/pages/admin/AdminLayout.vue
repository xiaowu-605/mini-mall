<template>
  <div class="admin-layout">
    <el-container class="admin-layout__container">
      <!-- 侧边栏 -->
      <el-aside
        width="200px"
        class="admin-layout__aside"
      >
        <div class="admin-layout__logo">
          <router-link to="/admin">Mini-Mall 后台</router-link>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#1f2937"
          text-color="#9ca3af"
          active-text-color="#ffffff"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/orders">
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><Menu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item
            v-if="auth.hasPermission('super_admin')"
            index="/admin/admins"
          >
            <el-icon><Setting /></el-icon>
            <span>管理员管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧区域 -->
      <el-container>
        <!-- 顶部栏 -->
        <el-header class="admin-layout__header">
          <div class="admin-layout__header-right">
            <el-icon><User /></el-icon>
            <span class="admin-layout__user-name">{{ auth.user?.name }}</span>
            <el-tag
              v-if="auth.hasPermission('super_admin')"
              type="danger"
              size="small"
            >
              超级管理员
            </el-tag>
            <el-tag
              v-else
              type="info"
              size="small"
            >
              管理员
            </el-tag>
            <el-button
              type="danger"
              size="small"
              text
              @click="doLogout"
            >
              退出登录
            </el-button>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="admin-layout__main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Goods,
  Tickets,
  Menu,
  DataLine,
  UserFilled,
  Setting,
  User,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 非 admin 跳转首页
if (!auth.isAdmin) {
  router.replace('/')
}

/** 当前激活的菜单项 */
const activeMenu = computed(() => route.path)

/** 退出登录 */
async function doLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style lang="less" scoped>
.admin-layout {
  min-height: 100vh;
  background: #f3f4f6;

  &__container {
    min-height: 100vh;
  }

  &__aside {
    background: #1f2937;
  }

  &__logo {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #374151;

    a {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 48px;
    background: @color-bg-white;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 @spacing-lg;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: @spacing-sm;
  }

  &__user-name {
    font-size: 14px;
    color: @color-text;
  }

  &__main {
    background: #f3f4f6;
    padding: @spacing-lg;
  }
}
</style>
