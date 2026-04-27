<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();

const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

const dropdownMenus = computed(() => [
  {
    handler: () => {
      router.push('/setting/merchant');
    },
    icon: 'lucide:store',
    text: '商家资料',
  },
  {
    handler: () => {
      router.push('/setting/account');
    },
    icon: 'lucide:user-cog',
    text: '账号设置',
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

const dropdownText = computed(() => {
  return userStore.userInfo?.realName || authStore.currentAdmin?.username || '';
});

const dropdownDescription = computed(() => {
  return authStore.currentMerchant?.name || userStore.userInfo?.desc || '';
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function markRead(id: number | string) {
  const item = notifications.value.find((entry) => entry.id === id);
  if (item) {
    item.isRead = true;
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}

watch(
  () => ({
    content: preferences.app.watermarkContent,
    enable: preferences.app.watermark,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username || ''} ${authStore.currentMerchant?.name || ''}`.trim(),
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus="dropdownMenus"
        :text="dropdownText"
        :description="dropdownDescription"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
