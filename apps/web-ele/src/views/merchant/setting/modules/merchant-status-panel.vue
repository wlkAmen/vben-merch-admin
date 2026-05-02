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
  <div class="grid gap-5">
    <section class="rounded-2xl border bg-muted/15 p-4">
      <div class="text-base font-semibold text-foreground">商家状态概览</div>
      <div class="mt-1 text-sm text-muted-foreground">
        这里主要查看商家当前启用状态、类型以及后台账号关联情况，方便快速确认是否影响日常经营。
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.label"
        class="rounded-2xl border bg-card p-4"
      >
        <p class="mb-2 text-sm text-muted-foreground">{{ item.label }}</p>
        <strong class="text-base font-medium text-foreground">{{
          item.value
        }}</strong>
      </div>
    </div>
  </div>
</template>
