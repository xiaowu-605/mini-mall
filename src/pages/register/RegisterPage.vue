<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">注册</h1>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item
          label="昵称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入昵称"
          />
        </el-form-item>

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
            placeholder="至少 6 位密码"
            show-password
          />
        </el-form-item>

        <el-form-item
          label="确认密码"
          prop="confirmPassword"
        >
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
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
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <p class="auth-card__tip">
        已有账号？<router-link
          to="/login"
          class="auth-card__link"
          >立即登录</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { register } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

/** 验证两次密码一致 */
const validateConfirm = (_rule: any, value: string, callback: Function) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

/** 提交注册 */
async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const registerData = { email: form.email, password: form.password, name: form.name }
    await register(registerData)
    await authStore.fetchUser()
    ElMessage.success('注册成功')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '注册失败')
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
}
</style>
