<script lang="ts" setup>
import type { MerchantOrderUserInfo } from '#/api';

import { computed } from 'vue';

import {
  ElAvatar,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

const props = defineProps<{
  title?: string;
  userInfo?: MerchantOrderUserInfo | null;
}>();

const displayName = computed(() => {
  return props.userInfo?.nickname || props.userInfo?.username || '-';
});

const avatarText = computed(() => {
  const name = displayName.value;
  return name && name !== '-' ? name.slice(0, 1) : 'U';
});
</script>

<template>
  <div class="rounded-2xl border bg-card p-4 shadow-sm">
    <div class="mb-3 text-base font-medium">{{ title || '用户信息' }}</div>

    <div v-if="userInfo" class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div class="flex items-center gap-3">
        <ElAvatar :size="56" :src="userInfo.avatar">
          {{ avatarText }}
        </ElAvatar>
        <div class="space-y-1">
          <div class="font-medium text-foreground">
            {{ displayName }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ userInfo.mobile || '-' }}
          </div>
        </div>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="用户 ID">
          {{ userInfo.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="昵称">
          {{ userInfo.nickname || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用户名">
          {{ userInfo.username || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ userInfo.mobile || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div v-else class="text-sm text-muted-foreground">
      当前没有用户信息。
    </div>
  </div>
</template>
