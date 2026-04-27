<script setup lang="ts">
import { ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import MerchantProfileForm from './modules/merchant-profile-form.vue';
import MerchantStatusPanel from './modules/merchant-status-panel.vue';

const userStore = useUserStore();

const tabsValue = ref<string>('profile');

const tabs = ref([
  {
    label: '商家资料',
    value: 'profile',
  },
  {
    label: '商家状态',
    value: 'status',
  },
]);
</script>

<template>
  <Profile
    v-model:model-value="tabsValue"
    title="商家资料"
    :tabs="tabs"
    :user-info="userStore.userInfo"
  >
    <template #content>
      <MerchantProfileForm v-if="tabsValue === 'profile'" />
      <MerchantStatusPanel v-if="tabsValue === 'status'" />
    </template>
  </Profile>
</template>
