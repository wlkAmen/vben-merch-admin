import type {
  MerchantAdminProfile,
  MerchantProfile,
} from './auth';

import { requestClient } from '#/api/request';

export interface MerchantProfileResult {
  merchant: MerchantProfile;
}

export interface AccountProfileResult {
  admin: MerchantAdminProfile;
}

export interface UpdateMerchantProfileParams {
  agencyName?: string;
  area?: string;
  businessLicenseNumber?: string;
  contactName?: string;
  contactPhone?: string;
  corp_id?: string;
  description?: string;
  kf_url?: string;
  logo?: string;
  mobile?: string;
  name?: string;
  servicePhone?: string;
  transactorName?: string;
  transactorPhone?: string;
  travelAgencyLicenseNumber?: string;
}

export interface UpdateAccountProfileParams {
  avatar?: string;
  email?: string;
  mobile?: string;
  nickname?: string;
}

export async function getMerchantProfileApi() {
  return requestClient.get<MerchantProfileResult>('/setting/merchant-profile');
}

export async function updateMerchantProfileApi(
  data: UpdateMerchantProfileParams,
) {
  return requestClient.post<MerchantProfileResult>(
    '/setting/merchant-profile',
    data,
  );
}

export async function getAccountProfileApi() {
  return requestClient.get<AccountProfileResult>('/setting/account-profile');
}

export async function updateAccountProfileApi(
  data: UpdateAccountProfileParams,
) {
  return requestClient.post<AccountProfileResult>(
    '/setting/account-profile',
    data,
  );
}
