<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  getAccountProfileApi,
  updateAccountProfileApi,
} from '#/api';
import { useAuthStore } from '#/store';
import MerchantImageUpload from '#/views/merchant/common/image-upload.vue';

const authStore = useAuthStore();
const loading = ref(false);
const avatar = ref('');

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'nickname',
    label: '账号昵称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'mobile',
    label: '手机号',
  },
  {
    component: 'Input',
    fieldName: 'email',
    label: '邮箱',
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4 md:grid-cols-2',
});

function normalizeAccount(profile: Record<string, any>) {
  return {
    email: profile.email || '',
    mobile: profile.mobile || '',
    nickname: profile.nickname || '',
  };
}

async function loadAccount() {
  loading.value = true;
  try {
    const { admin } = await getAccountProfileApi();
    avatar.value = admin.avatar || '';
    await formApi.setValues(normalizeAccount(admin));
  } catch (error) {
    console.error(error);
    ElMessage.error('账号资料加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  try {
    const values = await formApi.getValues();
    const { admin } = await updateAccountProfileApi({
      ...values,
      avatar: avatar.value,
    });
    avatar.value = admin.avatar || '';
    await formApi.setValues(normalizeAccount(admin));
    await authStore.fetchUserInfo();
    ElMessage.success('账号资料已保存');
  } catch (error) {
    console.error(error);
  }
}

loadAccount();
</script>

<template>
  <div v-loading="loading" class="grid gap-4" @keydown.enter.prevent="handleSubmit">
    <div class="rounded-xl border p-4">
      <div class="mb-3 text-sm font-medium">账号头像</div>
      <MerchantImageUpload v-model="avatar" />
      <div class="mt-3 text-xs text-muted-foreground">
        用于账号资料展示，支持 JPG、PNG、WEBP，大小不超过 2MB。
      </div>
    </div>

    <Form />
    <VbenButton class="mt-4" type="submit" @click="handleSubmit">
      保存账号资料
    </VbenButton>
  </div>
</template>
