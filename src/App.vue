<template>
  <AppHeader v-if="!isAdminRoute" />
  <router-view />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>
