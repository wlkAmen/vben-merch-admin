import type { UserInfo } from '@vben/types';

import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  export interface MerchantAdmin {
    avatar?: string;
    email?: string;
    id: number;
    merch_id?: number;
    mobile?: string;
    nickname?: string;
    status?: string;
    username: string;
  }

  export interface MerchantProfile {
    id: number;
    logo?: string;
    mobile?: string;
    name?: string;
    status?: string;
    type?: string;
  }

  export interface LoginParams {
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    admin: MerchantAdmin;
    merchant: MerchantProfile;
    token: string;
  }

  export interface ChangePasswordParams {
    confirm_password?: string;
    confirmPassword?: string;
    new_password?: string;
    newPassword?: string;
    old_password?: string;
    oldPassword?: string;
  }
}

export function normalizeUserInfo(
  data: Pick<AuthApi.LoginResult, 'admin' | 'merchant'>,
  token: null | string = '',
): UserInfo {
  const { admin, merchant } = data;

  return {
    admin,
    avatar: admin.avatar || merchant.logo || '',
    desc: merchant.name || '',
    email: admin.email || '',
    homePath: '/',
    introduction: merchant.name || '',
    merchant,
    realName: admin.nickname || admin.username,
    roles: [],
    token: token || '',
    userId: String(admin.id),
    username: admin.username,
  } as UserInfo;
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

export async function getProfileApi() {
  const accessStore = useAccessStore();
  const profile =
    await requestClient.get<Pick<AuthApi.LoginResult, 'admin' | 'merchant'>>(
      '/auth/profile',
    );
  return normalizeUserInfo(profile, accessStore.accessToken);
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function changePasswordApi(data: AuthApi.ChangePasswordParams) {
  return requestClient.post('/auth/change-password', data);
}

export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
