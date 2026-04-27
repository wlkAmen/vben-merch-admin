<script setup lang="ts">
import { ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import AccountProfileForm from './modules/account-profile-form.vue';
import AccountPasswordForm from './modules/account-password-form.vue';

const userStore = useUserStore();

const tabsValue = ref<string>('account');

const tabs = ref([
  {
    label: '账号资料',
    value: 'account',
  },
  {
    label: '修改密码',
    value: 'password',
  },
]);
</script>

<template>
  <Profile
    v-model:model-value="tabsValue"
    title="账号设置"
    :tabs="tabs"
    :user-info="userStore.userInfo"
  >
    <template #content>
      <AccountProfileForm v-if="tabsValue === 'account'" />
      <AccountPasswordForm v-if="tabsValue === 'password'" />
    </template>
  </Profile>
</template>
