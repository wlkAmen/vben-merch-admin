<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  getMerchantProfileApi,
  updateMerchantProfileApi,
} from '#/api';
import { useAuthStore } from '#/store';
import MerchantImageUpload from '#/views/merchant/common/image-upload.vue';

const authStore = useAuthStore();
const loading = ref(false);
const logo = ref('');

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '商家名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'mobile',
    label: '联系电话',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'kf_url',
    label: '客服链接',
  },
  {
    component: 'Input',
    fieldName: 'corp_id',
    label: '企业微信 ID',
  },
  {
    component: 'Input',
    fieldName: 'area',
    label: '省市区',
    componentProps: {
      placeholder: '支持使用 / 拼接，例如 浙江省/温州市/鹿城区',
    },
  },
  {
    component: 'Input',
    fieldName: 'description',
    label: '详细地址',
    componentProps: {
      rows: 3,
      type: 'textarea',
    },
    formItemClass: 'col-span-2',
  },
  {
    component: 'Divider',
    fieldName: 'divider1',
    hideLabel: true,
    formItemClass: 'col-span-2 pb-0',
    renderComponentContent() {
      return {
        default: () => '经营与联系人信息',
      };
    },
  },
  {
    component: 'Input',
    fieldName: 'transactorName',
    label: '经办人姓名',
  },
  {
    component: 'Input',
    fieldName: 'transactorPhone',
    label: '经办人电话',
  },
  {
    component: 'Input',
    fieldName: 'agencyName',
    label: '旅行社名称',
  },
  {
    component: 'Input',
    fieldName: 'travelAgencyLicenseNumber',
    label: '旅行社许可证号',
  },
  {
    component: 'Input',
    fieldName: 'businessLicenseNumber',
    label: '营业执照号',
  },
  {
    component: 'Input',
    fieldName: 'contactName',
    label: '联系人',
  },
  {
    component: 'Input',
    fieldName: 'contactPhone',
    label: '联系人电话',
  },
  {
    component: 'Input',
    fieldName: 'servicePhone',
    label: '客服电话',
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

function normalizeProfile(profile: Record<string, any>) {
  return {
    agencyName: profile.agencyName || '',
    area: Array.isArray(profile.area) ? profile.area.join('/') : profile.area || '',
    businessLicenseNumber: profile.businessLicenseNumber || '',
    contactName: profile.contactName || '',
    contactPhone: profile.contactPhone || '',
    corp_id: profile.corp_id || '',
    description: profile.description || '',
    kf_url: profile.kf_url || '',
    mobile: profile.mobile || '',
    name: profile.name || '',
    servicePhone: profile.servicePhone || '',
    transactorName: profile.transactorName || '',
    transactorPhone: profile.transactorPhone || '',
    travelAgencyLicenseNumber: profile.travelAgencyLicenseNumber || '',
  };
}

async function loadProfile() {
  loading.value = true;
  try {
    const { merchant } = await getMerchantProfileApi();
    logo.value = merchant.logo || '';
    await formApi.setValues(normalizeProfile(merchant));
  } catch (error) {
    console.error(error);
    ElMessage.error('商家资料加载失败，请稍后重试');
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
    const { merchant } = await updateMerchantProfileApi({
      ...values,
      logo: logo.value,
    });
    logo.value = merchant.logo || '';
    await formApi.setValues(normalizeProfile(merchant));
    await authStore.fetchUserInfo();
    ElMessage.success('商家资料已保存');
  } catch (error) {
    console.error(error);
  }
}

loadProfile();
</script>

<template>
  <div v-loading="loading" class="grid gap-4" @keydown.enter.prevent="handleSubmit">
    <div class="rounded-xl border p-4">
      <div class="mb-3 text-sm font-medium">商家 Logo</div>
      <MerchantImageUpload v-model="logo" />
      <div class="mt-3 text-xs text-muted-foreground">
        用于商家资料展示，支持 JPG、PNG、WEBP，大小不超过 2MB。
      </div>
    </div>

    <Form />
    <VbenButton class="mt-4" type="submit" @click="handleSubmit">
      保存商家资料
    </VbenButton>
  </div>
</template>
