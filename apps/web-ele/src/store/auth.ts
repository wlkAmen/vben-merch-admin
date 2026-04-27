import type { Recordable } from '@vben/types';

import type { MerchantSessionPayload } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import {
  getAuthProfileApi,
  loginApi,
  logoutApi,
  mapSessionToUserInfo,
} from '#/api';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const sessionProfile = ref<MerchantSessionPayload | null>(null);

  const currentAdmin = computed(() => sessionProfile.value?.admin ?? null);
  const currentMerchant = computed(
    () => sessionProfile.value?.merchant ?? null,
  );

  function applySessionProfile(profile: MerchantSessionPayload | null) {
    sessionProfile.value = profile;

    if (!profile) {
      userStore.setUserInfo(null);
      accessStore.setAccessCodes([]);
      return null;
    }

    accessStore.setAccessToken(profile.token || accessStore.accessToken);
    accessStore.setAccessCodes([]);

    const userInfo = mapSessionToUserInfo(profile);
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;
      const session = await loginApi(params);
      accessStore.setAccessToken(session.token);
      const userInfo = applySessionProfile(session);

      if (accessStore.loginExpired) {
        accessStore.setLoginExpired(false);
      } else {
        onSuccess
          ? await onSuccess?.()
          : await router.push(
              userInfo?.homePath || preferences.app.defaultHomePath,
            );
      }

      if (userInfo?.realName) {
        ElNotification({
          message: `${currentMerchant.value?.name || '商家后台'}，欢迎回来`,
          title: `你好，${userInfo.realName}`,
          type: 'success',
        });
      }
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 忽略退出接口异常，前端仍然清理本地状态
    }

    sessionProfile.value = null;
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const session = await getAuthProfileApi();
    const userInfo = applySessionProfile(session);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
    sessionProfile.value = null;
  }

  return {
    $reset,
    authLogin,
    currentAdmin,
    currentMerchant,
    fetchUserInfo,
    loginLoading,
    logout,
    sessionProfile,
  };
});
