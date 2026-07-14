<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">登录</h1>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item
          label="邮箱"
          prop="email"
        >
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱"
          />
        </el-form-item>

        <el-form-item
          label="密码"
          prop="password"
        >
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="auth-card__submit"
            :loading="loading"
            @click="onSubmit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <p class="auth-card__tip">
        还没有账号？<router-link
          to="/register"
          class="auth-card__link"
          >立即注册</router-link
        >
      </p>

      <!-- 演示账号一键填入 -->
      <div
        v-if="demoAccounts.length > 0"
        class="auth-card__demo"
      >
        <p class="auth-card__demo-title">演示账号（点击一键填入）</p>
        <div class="auth-card__demo-list">
          <button
            v-for="account in demoAccounts"
            :key="account.id"
            class="auth-card__demo-item"
            @click="fillAccount(account)"
          >
            <span class="auth-card__demo-name">{{ account.name }}</span>
            <span class="auth-card__demo-role">{{ account.roleLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { login, getDemoAccounts } from '@/api/auth'
import type { DemoAccount } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
let loading = ref(false)
let demoAccounts = ref<DemoAccount[]>([])

// 登录表单：邮箱 + 密码
const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/** 页面初始化：加载演示账号列表 */
onMounted(() => {
  fetchDemoAccounts()
})

/** 获取演示账号 */
async function fetchDemoAccounts() {
  try {
    const res = await getDemoAccounts()
    demoAccounts.value = res.data || []
  } catch (e) {
    console.error('获取演示账号失败:', e)
    // 静默处理，不影响正常登录
  }
}

/** 一键填入演示账号 */
function fillAccount(account: DemoAccount) {
  form.email = account.email
  form.password = account.password
}

/** 提交登录 */
async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await login(form)
    await authStore.fetchUser()
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } catch (e) {
    console.error(e)
    // 错误提示已由拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
.auth-page {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: @color-bg;
  padding: @spacing-md;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: @color-bg-white;
  border-radius: @radius-lg;
  box-shadow: @shadow-md;
  padding: @spacing-xl;

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
    text-align: center;
    margin-bottom: @spacing-lg;
  }

  &__submit {
    width: 100%;
  }

  &__tip {
    font-size: 14px;
    color: @color-text-secondary;
    text-align: center;
    margin-top: @spacing-md;
  }

  &__link {
    color: @color-primary;

    &:hover {
      color: @color-primary-hover;
    }
  }

  &__demo {
    margin-top: @spacing-lg;
    padding-top: @spacing-lg;
    border-top: 1px solid #e5e7eb;
  }

  &__demo-title {
    font-size: 13px;
    color: @color-text-muted;
    margin: 0 0 @spacing-sm;
    text-align: center;
  }

  &__demo-list {
    display: flex;
    flex-wrap: wrap;
    gap: @spacing-sm;
    justify-content: center;
  }

  &__demo-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: @spacing-sm @spacing-md;
    border: 1px solid #e5e7eb;
    border-radius: @radius-md;
    background: @color-bg-white;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: @color-primary;
      color: @color-primary;
      background: #eff6ff;
    }
  }

  &__demo-name {
    font-size: 13px;
    font-weight: 500;
    color: @color-text;
  }

  &__demo-role {
    font-size: 11px;
    color: @color-text-muted;
  }
}
</style>
