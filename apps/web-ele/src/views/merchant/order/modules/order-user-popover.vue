<script lang="ts" setup>
import type { MerchantOrderUserInfo } from '#/api';

import { computed } from 'vue';

import {
  ElAvatar,
  ElPopover,
} from 'element-plus';

const props = defineProps<{
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
  <ElPopover
    v-if="userInfo"
    placement="top-start"
    trigger="hover"
    :width="240"
  >
    <template #reference>
      <div class="flex items-center gap-3  justify-center">
        <ElAvatar :size="36" :src="userInfo.avatar">
          {{ avatarText }}
        </ElAvatar>
        <div class="min-w-0 text-left">
          <div class="truncate font-medium text-foreground">
            {{ displayName }}
          </div>
        </div>
      </div>
    </template>

    <div class="grid gap-2 text-sm">
      <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
        <div class="text-muted-foreground">ID</div>
        <div class="break-all">{{ userInfo.id || '-' }}</div>
      </div>
      <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
        <div class="text-muted-foreground">昵称</div>
        <div class="break-all">{{ userInfo.nickname || '-' }}</div>
      </div>
      <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
        <div class="text-muted-foreground">用户名</div>
        <div class="break-all">{{ userInfo.username || '-' }}</div>
      </div>
      <div class="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
        <div class="text-muted-foreground">手机号</div>
        <div class="break-all">{{ userInfo.mobile || '-' }}</div>
      </div>
    </div>
  </ElPopover>

  <span v-else>-</span>
</template>
