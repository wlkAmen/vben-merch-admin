<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getAccountProfileApi, updateAccountProfileApi } from '#/api';
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
  <div
    v-loading="loading"
    class="grid gap-5"
    @keydown.enter.prevent="handleSubmit"
  >
    <section class="rounded-2xl border bg-muted/15 p-4">
      <div class="text-base font-semibold text-foreground">基础资料</div>
      <div class="mt-1 text-sm text-muted-foreground">
        用于后台账号识别与日常联系，不影响商家对外展示信息。
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <div class="rounded-2xl border p-4">
        <div class="text-sm font-medium text-foreground">账号头像</div>
        <div class="mt-3">
          <MerchantImageUpload v-model="avatar" />
        </div>
        <div class="mt-3 text-xs leading-6 text-muted-foreground">
          支持 JPG、PNG、WEBP，建议使用清晰的管理员头像，文件大小不超过 2MB。
        </div>
      </div>

      <div class="rounded-2xl border p-4">
        <div class="mb-4 text-sm font-medium text-foreground">资料表单</div>
        <Form />
      </div>
    </section>

    <div class="flex justify-end">
      <VbenButton type="submit" @click="handleSubmit">
        保存账号资料
      </VbenButton>
    </div>
  </div>
</template>
