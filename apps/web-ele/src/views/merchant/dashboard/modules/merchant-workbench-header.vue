<script setup lang="ts">
import { preferences } from '@vben/preferences';
import { VbenAvatar } from '@vben/common-ui';

interface Props {
  adminName: string;
  avatar?: string;
  lastLoginTime: string;
  merchantName: string;
  pendingTaskCount: number;
  todayOrderCount: number;
  totalProductCount: number;
}

withDefaults(defineProps<Props>(), {
  avatar: '',
});
</script>

<template>
  <div class="card-box p-4 py-6 lg:flex">
    <VbenAvatar
      :src="avatar || preferences.app.defaultAvatar"
      class="size-20"
    />
    <div class="flex flex-col justify-center md:ml-6 md:mt-0">
      <h1 class="text-md font-semibold md:text-xl">
        {{ merchantName }}
      </h1>
      <span class="text-foreground/80 mt-1">
        当前管理员 {{ adminName || '未识别账号' }}
        <span v-if="lastLoginTime">，最近登录时间 {{ lastLoginTime }}</span>
      </span>
    </div>
    <div class="mt-4 flex flex-1 justify-end md:mt-0">
      <div class="flex flex-col justify-center text-right">
        <span class="text-foreground/80">待办</span>
        <span class="text-2xl">{{ pendingTaskCount }}</span>
      </div>

      <div class="mx-12 flex flex-col justify-center text-right md:mx-16">
        <span class="text-foreground/80">产品</span>
        <span class="text-2xl">{{ totalProductCount }}</span>
      </div>

      <div class="mr-4 flex flex-col justify-center text-right md:mr-10">
        <span class="text-foreground/80">今日订单</span>
        <span class="text-2xl">{{ todayOrderCount }}</span>
      </div>
    </div>
  </div>
</template>
