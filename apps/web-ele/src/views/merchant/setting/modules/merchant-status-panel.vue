<script setup lang="ts">
import { computed } from 'vue';

import { useAuthStore } from '#/store';

const authStore = useAuthStore();

const merchant = computed(() => authStore.currentMerchant);
const admin = computed(() => authStore.currentAdmin);

const items = computed(() => [
  {
    label: '商家 ID',
    value: merchant.value?.id || '-',
  },
  {
    label: '商家状态',
    value: merchant.value?.status_text || '-',
  },
  {
    label: '商家类型',
    value: merchant.value?.type_text || '-',
  },
  {
    label: '管理员账号',
    value: admin.value?.username || '-',
  },
  {
    label: '管理员状态',
    value: admin.value?.status_text || '-',
  },
  {
    label: '最近登录时间',
    value: admin.value?.logintime_text || '-',
  },
]);
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div
      v-for="item in items"
      :key="item.label"
      class="rounded-xl border p-4"
    >
      <p class="text-muted-foreground mb-2 text-sm">{{ item.label }}</p>
      <strong class="text-base font-medium">{{ item.value }}</strong>
    </div>
  </div>
</template>
