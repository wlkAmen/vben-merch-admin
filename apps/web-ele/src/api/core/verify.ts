import { requestClient } from '#/api/request';

export interface MerchantVerifyUserInfo {
  avatar?: string;
  id: number;
  mobile?: string;
  nickname?: string;
  username?: string;
}

export interface MerchantVerifyItem {
  code: string;
  createtime: number;
  createtime_text: string;
  date: string;
  id: number;
  merch_id: number;
  mobile: string;
  number: number;
  order_id: number;
  order_sn: string;
  realname: string;
  status: string;
  status_text: string;
  suit_id: number;
  ticket_id: number;
  total_fee: string;
  user_info?: MerchantVerifyUserInfo;
  verifytime: number;
  verifytime_text: string;
}

export interface MerchantVerifyListResult {
  list: MerchantVerifyItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantVerifyListParams {
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MerchantVerifyOrderInfo {
  date: string;
  id: number;
  mobile: string;
  number: number;
  order_sn: string;
  passengers: Array<Record<string, any>>;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  platform: string;
  platform_text: string;
  price: string;
  realname: string;
  remark: string;
  status: string;
  status_text: string;
  suit_info?: Record<string, any>;
  ticket_info?: Record<string, any>;
  total_fee: string;
}

export interface MerchantVerifyDetail {
  code: string;
  createtime: number;
  createtime_text: string;
  id: number;
  merch_id: number;
  order_info: MerchantVerifyOrderInfo;
  saler_id: number;
  status: string;
  status_text: string;
  verifytime: number;
  verifytime_text: string;
}

export interface MerchantVerifyDetailResult {
  detail: MerchantVerifyDetail;
}

export interface MerchantVerifyUseParams {
  code?: string;
  id?: number;
}

export async function getTicketVerifyListApi(params: MerchantVerifyListParams) {
  return requestClient.get<MerchantVerifyListResult>('/verify/ticket/list', {
    params,
  });
}

export async function getTicketVerifyDetailApi(params: { code?: string; id?: number }) {
  return requestClient.get<MerchantVerifyDetailResult>('/verify/ticket/detail', {
    params,
  });
}

export async function useTicketVerifyApi(data: MerchantVerifyUseParams) {
  return requestClient.post<MerchantVerifyDetailResult>('/verify/ticket/use', data);
}
