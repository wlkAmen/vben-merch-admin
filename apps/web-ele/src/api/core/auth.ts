import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    password?: string;
    username?: string;
  }
}

export interface MerchantAdminProfile {
  avatar: string;
  email: string;
  id: number;
  logintime: number;
  logintime_text: string;
  merch_id: number;
  mobile: string;
  nickname: string;
  status: string;
  status_text: string;
  username: string;
}

export interface MerchantProfile {
  agencyName?: string;
  area?: string | string[];
  businessLicenseNumber?: string;
  contactName?: string;
  contactPhone?: string;
  corp_id?: string;
  description?: string;
  id: number;
  income_ratio?: string;
  is_contract?: string;
  kf_mode?: string;
  kf_url?: string;
  logo: string;
  mobile: string;
  name: string;
  platform_income?: string;
  servicePhone?: string;
  status: string;
  status_text: string;
  transactorName?: string;
  transactorPhone?: string;
  travelAgencyLicenseNumber?: string;
  type_text: string;
}

export interface MerchantSessionPayload {
  admin: MerchantAdminProfile;
  merchant: MerchantProfile;
  token: string;
}

export interface ChangePasswordParams {
  confirm_password: string;
  new_password: string;
  old_password: string;
}

export function mapSessionToUserInfo(
  session: MerchantSessionPayload,
): UserInfo {
  const admin = session.admin;
  const merchant = session.merchant;

  return {
    avatar: admin.avatar || merchant.logo || '',
    desc: merchant.name || '商家管理后台',
    email: admin.email,
    homePath: '/analytics',
    merchantId: merchant.id,
    merchantName: merchant.name,
    mobile: admin.mobile,
    realName: admin.nickname || admin.username,
    roles: ['merchant'],
    token: session.token,
    userId: String(admin.id),
    username: admin.username,
  } as UserInfo;
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<MerchantSessionPayload>('/auth/login', data);
}

export async function getAuthProfileApi() {
  return requestClient.get<MerchantSessionPayload>('/auth/profile');
}

export async function changePasswordApi(data: ChangePasswordParams) {
  return requestClient.post('/auth/change-password', data);
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function getAccessCodesApi() {
  return [] as string[];
}
