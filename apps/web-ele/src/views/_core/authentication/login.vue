<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { ref } from 'vue';

import { SliderCaptcha, VbenButton, VbenCheckbox, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenForm } from '#/adapter/form';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const captchaPassed = ref(false);
const captchaRef = ref<null | { resume: () => void }>(null);
const rememberMe = ref(false);

const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;
const localUsername = localStorage.getItem(REMEMBER_ME_KEY) || '';

rememberMe.value = !!localUsername;

const formSchema = [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '请输入商家管理员账号',
    },
    fieldName: 'username',
    label: $t('authentication.username'),
    rules: z.string().min(1, { message: '请输入商家管理员账号' }),
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: '请输入登录密码',
    },
    fieldName: 'password',
    label: $t('authentication.password'),
    rules: z.string().min(1, { message: '请输入登录密码' }),
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    hideLabel: true,
    hideRequiredMark: true,
  },
  schema: formSchema,
  showDefaultActions: false,
});

if (localUsername) {
  formApi.setFieldValue('username', localUsername);
}

function resetCaptcha() {
  captchaPassed.value = false;
  captchaRef.value?.resume();
}

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues<Recordable<any>>();

  if (!valid || !captchaPassed.value) {
    return;
  }

  localStorage.setItem(
    REMEMBER_ME_KEY,
    rememberMe.value ? values?.username || '' : '',
  );

  try {
    await authStore.authLogin(values);
  } catch (error) {
    resetCaptcha();
    throw error;
  }
}
</script>

<template>
  <div class="auth-login" @keydown.enter.prevent="handleSubmit">
    <div class="auth-login__title">
      <h2 class="auth-login__heading">欢迎回来 👋</h2>
      <p class="auth-login__desc">
        请输入微凌客旅游商家后台管理员账号与密码登录。
      </p>
    </div>

    <Form />

    <div class="auth-login__meta">
      <VbenCheckbox v-model="rememberMe" name="rememberMe">
        {{ $t('authentication.rememberMe') }}
      </VbenCheckbox>
    </div>

    <div class="auth-login__captcha">
      <SliderCaptcha
        ref="captchaRef"
        v-model="captchaPassed"
        success-text="验证通过"
        text="请按住滑块拖动"
      />
    </div>

    <VbenButton
      :class="{ 'cursor-not-allowed opacity-90': !captchaPassed }"
      :disabled="!captchaPassed"
      :loading="authStore.loginLoading"
      aria-label="login"
      class="w-full"
      @click="handleSubmit"
    >
      {{ $t('common.login') }}
    </VbenButton>
  </div>
</template>

<style scoped>
.auth-login__title {
  margin-bottom: 28px;
}

.auth-login__heading {
  margin-bottom: 12px;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

.auth-login__desc {
  font-size: 14px;
  line-height: 1.75;
  color: hsl(var(--muted-foreground));
}

.auth-login__meta {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;
}

.auth-login__captcha {
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .auth-login__heading {
    font-size: 30px;
  }
}
</style>
