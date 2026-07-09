---
name: vue-component-generator
description: 根据需求描述，生成符合项目规范的 Vue 3 页面或组件。
version: '1.0.0'
license: MIT
metadata:
  hermes:
    tags: [生成vue页面]
---

# Vue 组件/页面生成器

## 功能说明

根据需求描述，生成符合项目规范的 Vue 3 页面或组件。

## 项目规范

### 技术栈

- Vue 3 Composition API（`<script setup lang="ts">`）
- 样式：`<style lang="less" scoped>`，BEM 命名
- UI 组件库：Element Plus（按需自动导入，无需手动 import）
- 图标：`@element-plus/icons-vue`（需显式 import）
- 全局 Less 变量自动注入（`@color-*`、`@spacing-*`、`@radius-*` 等）
- 类型定义：`@/types/` 目录
- API 请求：`@/api/` 目录

### 代码规范

- 模板中 UI 文案使用中文
- 代码注释使用中文
- Element Plus 组件使用 `el-` 前缀（如 `el-button`），按需自动导入无需在 script 中 import
- Element Plus 图标需从 `@element-plus/icons-vue` 显式导入
- 自定义类名使用 BEM：`.page-name__element--modifier`
- 状态管理用 Pinia（`@/stores/`）
- 路由跳转用 `useRouter` / `useRoute` from `vue-router`

## 生成模板

### 页面组件

```vue
<template>
  <div class="page-name">
    <div class="page-name__header">
      <h1 class="page-name__title">页面标题</h1>
    </div>
    <div class="page-name__body">
      <!-- 内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// Element Plus 组件自动导入，无需 import
// 图标需显式导入
// import { Search } from '@element-plus/icons-vue'

// 状态
const loading = ref(false)

// 初始化
onMounted(() => {
  // 获取数据
})
</script>

<style lang="less" scoped>
.page-name {
  min-height: 100vh;
  background: @color-bg;

  &__header {
    background: @color-bg-white;
    padding: @spacing-lg @spacing-md;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
  }

  &__body {
    max-width: 1280px;
    margin: 0 auto;
    padding: @spacing-lg @spacing-md;
  }
}
</style>
```

## 全局 Less 变量

以下变量已在 `vite.config.ts` 中通过 `additionalData` 自动注入，所有 `<style lang="less" scoped>` 中可直接使用：

| 类别 | 变量                       | 示例值           |
| ---- | -------------------------- | ---------------- |
| 颜色 | `@color-primary`           | `#3b82f6`        |
|      | `@color-primary-hover`     | `#2563eb`        |
|      | `@color-danger`            | `#ef4444`        |
|      | `@color-success`           | `#22c55e`        |
|      | `@color-text`              | `#111827`        |
|      | `@color-text-secondary`    | `#6b7280`        |
|      | `@color-text-muted`        | `#9ca3af`        |
|      | `@color-bg`                | `#f9fafb`        |
|      | `@color-bg-white`          | `#ffffff`        |
|      | `@color-border`            | `#d1d5db`        |
| 间距 | `@spacing-xs/sm/md/lg/xl`  | `4/8/16/24/32px` |
| 圆角 | `@radius-sm/md/lg/full`    | `4/8/12/9999px`  |
| 阴影 | `@shadow-sm`、`@shadow-md` | —                |
| 断点 | `@screen-sm/md/lg`         | `640/768/1024px` |

## 常用 Element Plus 组件速查

| 场景     | 组件              | 示例                                                                         |
| -------- | ----------------- | ---------------------------------------------------------------------------- |
| 搜索输入 | `el-input`        | `<el-input v-model="kw" prefix-icon={Search} clearable @input="onSearch" />` |
| 按钮     | `el-button`       | `<el-button type="primary" @click="fn">确定</el-button>`                     |
| 标签     | `el-tag`          | `<el-tag type="info">分类</el-tag>`                                          |
| 数字输入 | `el-input-number` | `<el-input-number v-model="qty" :min="1" :max="99" />`                       |
| 分页     | `el-pagination`   | `<el-pagination :current-page="p" :total="t" @current-change="fn" />`        |
| 空状态   | `el-empty`        | `<el-empty description="暂无数据" />`                                        |
| 加载     | `v-loading` 指令  | `<div v-loading="loading">...</div>`                                         |
| 弹窗     | `el-dialog`       | `<el-dialog v-model="visible" title="标题">...</el-dialog>`                  |
| 表格     | `el-table`        | `<el-table :data="list">...</el-table>`                                      |
| 卡片     | `el-card`         | `<el-card shadow="hover">...</el-card>`                                      |
| 消息     | `ElMessage`       | `import { ElMessage } from 'element-plus'`                                   |

## 执行步骤

1. **确认需求**：页面路由、功能列表、数据来源
2. **生成模板代码**：按上述模板生成 `<template>` + `<script>` + `<style>`
3. **添加路由**：在 `src/router/index.ts` 中添加路由配置
4. **验证**：`pnpm dev:frontend` 确认编译通过
