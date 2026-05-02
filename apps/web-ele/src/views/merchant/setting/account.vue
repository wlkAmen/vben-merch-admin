<script setup lang="ts">
import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElTag } from 'element-plus';

import { useAuthStore } from '#/store';

import AccountPasswordForm from './modules/account-password-form.vue';
import AccountProfileForm from './modules/account-profile-form.vue';

const authStore = useAuthStore();

const tabsValue = ref<string>('account');

const tabs = [
  {
    description: '维护头像、昵称、手机号与邮箱',
    icon: 'lucide:user-round-cog',
    label: '账号资料',
    value: 'account',
  },
  {
    description: '修改登录密码并重新登录',
    icon: 'lucide:key-round',
    label: '安全设置',
    value: 'password',
  },
];

const adminSummary = computed(() => [
  {
    label: '当前账号',
    value:
      authStore.currentAdmin?.nickname ||
      authStore.currentAdmin?.username ||
      '-',
  },
  {
    label: '登录名',
    value: authStore.currentAdmin?.username || '-',
  },
  {
    label: '账号状态',
    value: authStore.currentAdmin?.status_text || '-',
  },
  {
    label: '最近登录',
    value: authStore.currentAdmin?.logintime_text || '-',
  },
]);
</script>

<template>
  <Page auto-content-height content-class="flex flex-col gap-4">
    <section class="setting-hero rounded-3xl border px-6 py-6">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="space-y-3">
          <div
            class="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            <IconifyIcon icon="lucide:user-cog" />
            账号设置
          </div>
          <div class="text-2xl font-semibold text-foreground">
            维护当前管理员资料与登录安全
          </div>
          <div class="max-w-3xl text-sm leading-6 text-muted-foreground">
            日常高频使用的是头像、昵称、手机号、邮箱和密码。
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElTag round size="large" type="primary">
            {{ authStore.currentAdmin?.status_text || '账号状态未知' }}
          </ElTag>
        </div>
      </div>
    </section>

    <section class="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="grid self-start gap-4">
        <div class="rounded-3xl border bg-card p-4 shadow-sm">
          <div class="text-sm font-medium text-foreground">设置导航</div>
          <div class="mt-4 grid gap-2">
            <button
              v-for="item in tabs"
              :key="item.value"
              :class="{ 'setting-nav-item--active': tabsValue === item.value }"
              class="setting-nav-item"
              type="button"
              @click="tabsValue = item.value"
            >
              <span class="setting-nav-item__icon">
                <IconifyIcon :icon="item.icon" />
              </span>
              <span class="min-w-0 flex-1 text-left">
                <span class="block text-sm font-medium">{{ item.label }}</span>
                <span class="mt-1 block text-xs text-muted-foreground">
                  {{ item.description }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div class="rounded-3xl border bg-card p-4 shadow-sm">
          <div class="text-sm font-medium text-foreground">账号概览</div>
          <div class="mt-4 grid gap-3">
            <div
              v-for="item in adminSummary"
              :key="item.label"
              class="rounded-2xl border bg-muted/25 px-4 py-3"
            >
              <div class="text-xs text-muted-foreground">{{ item.label }}</div>
              <div class="mt-1.5 break-all text-sm font-medium text-foreground">
                {{ item.value }}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="min-w-0 rounded-3xl border bg-card p-5 shadow-sm">
        <AccountProfileForm v-if="tabsValue === 'account'" />
        <AccountPasswordForm v-else />
      </div>
    </section>
  </Page>
</template>

<style scoped>
.setting-hero {
  background:
    radial-gradient(
      circle at top right,
      rgb(64 158 255 / 10%),
      transparent 28%
    ),
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)));
}

.setting-nav-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  padding: 14px 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 18px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.setting-nav-item:hover,
.setting-nav-item--active {
  background: hsl(var(--primary) / 5%);
  border-color: hsl(var(--primary) / 40%);
}

.setting-nav-item--active {
  box-shadow: 0 8px 22px rgb(59 130 246 / 10%);
}

.setting-nav-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
  border-radius: 12px;
}
</style>
