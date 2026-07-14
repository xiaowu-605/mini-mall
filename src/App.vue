<template>
  <el-config-provider :locale="zhCn">
    <AppHeader v-if="!isAdminRoute" />
    <router-view v-slot="{ Component, route: currentRoute }">
      <keep-alive>
        <component
          :is="Component"
          v-if="currentRoute.meta.keepAlive"
        />
      </keep-alive>
      <component
        :is="Component"
        v-if="!currentRoute.meta.keepAlive"
      />
    </router-view>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>
