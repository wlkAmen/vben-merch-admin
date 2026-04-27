import { requestClient } from '#/api/request';

export interface MerchantRefundUserInfo {
  avatar?: string;
  id: number;
  mobile?: string;
  nickname?: string;
  username?: string;
}

export interface MerchantRefundListOrderInfo {
  consignee?: string;
  date?: string;
  goods_sku_text?: string;
  goods_title?: string;
  id: number;
  mobile?: string;
  order_sn: string;
  pay_fee: string;
  realname?: string;
  suit_name?: string;
  title?: string;
  total_fee: string;
}

export interface MerchantRefundItem {
  can_pass: boolean;
  can_reject: boolean;
  createtime: number;
  finishtime: number;
  id: number;
  order_info: MerchantRefundListOrderInfo;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  refund_fee: string;
  refund_sn: string;
  refund_status: string;
  refund_status_text: string;
  remark: string;
  status: string;
  status_text: string;
  sys_msg: string;
  type: string;
  type_text: string;
  user_info: MerchantRefundUserInfo;
}

export interface MerchantRefundListResult {
  list: MerchantRefundItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantRefundListParams {
  date_from?: string;
  date_to?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  refund_status?: string;
  status?: string;
  type?: string;
}

export interface MerchantRefundOrderInfo {
  consignee?: string;
  date?: string;
  dispatch_amount?: string;
  goods_amount?: string;
  id: number;
  mobile?: string;
  number?: number;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  platform: string;
  platform_text: string;
  realname?: string;
  refund_fee: string;
  remark: string;
  status: string;
  status_text: string;
  total_fee: string;
}

export interface MerchantRefundLineInfo {
  id?: number;
  title?: string;
}

export interface MerchantRefundTicketInfo {
  id?: number;
  title?: string;
}

export interface MerchantRefundSuitInfo {
  id?: number;
  name?: string;
}

export interface MerchantRefundGoodsItem {
  aftersale_status?: string;
  aftersale_status_text?: string;
  dispatch_fee?: string;
  dispatch_status?: string;
  dispatch_status_text?: string;
  goods_id?: number;
  goods_image?: string;
  goods_num?: number;
  goods_price?: string;
  goods_sku_text?: string;
  goods_title?: string;
  id?: number;
  order_id?: number;
  pay_price?: string;
  refund_fee?: string;
  refund_status?: string;
  refund_status_text?: string;
}

export interface MerchantRefundDetail {
  can_pass: boolean;
  can_reject: boolean;
  createtime: number;
  finishtime: number;
  goods_item: MerchantRefundGoodsItem | null;
  id: number;
  line_info: MerchantRefundLineInfo | null;
  order_info: MerchantRefundOrderInfo;
  order_item_id: number;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  payment_json?: null | Record<string, any> | string;
  refund_fee: string;
  refund_sn: string;
  refund_status: string;
  refund_status_text: string;
  remark: string;
  status: string;
  status_text: string;
  suit_info: MerchantRefundSuitInfo | null;
  sys_msg: string;
  ticket_info: MerchantRefundTicketInfo | null;
  type: string;
  type_text: string;
  updatetime: number;
  user_id: number;
  user_info: MerchantRefundUserInfo;
}

export interface MerchantRefundDetailResult {
  detail: MerchantRefundDetail;
}

export interface MerchantRefundRejectPayload {
  id: number;
  reject_msg: string;
}

export async function getRefundListApi(params: MerchantRefundListParams) {
  return requestClient.get<MerchantRefundListResult>('/refund/list', {
    params,
  });
}

export async function getRefundDetailApi(id: number) {
  return requestClient.get<MerchantRefundDetailResult>('/refund/detail', {
    params: { id },
  });
}

export async function passRefundApi(id: number) {
  return requestClient.post<MerchantRefundDetailResult>('/refund/pass', { id });
}

export async function rejectRefundApi(data: MerchantRefundRejectPayload) {
  return requestClient.post<MerchantRefundDetailResult>('/refund/reject', data);
}
