import { requestClient } from '#/api/request';

export interface MerchantSettlementOverview {
  pending_amount: string;
  pending_count: number;
  refund_amount: string;
  settled_amount: string;
  settled_count: number;
}

export interface MerchantSettlementOverviewResult {
  overview: MerchantSettlementOverview;
}

export interface MerchantSettlementItem {
  apply_status: string;
  apply_status_text: string;
  biz_type: string;
  biz_type_text: string;
  completed_at: number;
  current_settle_amount: string;
  id: number;
  item_type?: string;
  item_type_text?: string;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  payment_mode?: string;
  platform_amount?: string;
  refund_fee: string;
  remark?: string;
  settle_amount: string;
  settle_channel?: string;
  settle_channel_text?: string;
  settled_at: number;
  settlement_apply_id: number;
  settlement_order_id: number;
  settlement_status: string;
  settlement_status_text: string;
}

export interface MerchantSettlementItemListParams {
  biz_type?: string;
  date_from?: string;
  date_to?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  settlement_status?: string;
}

export interface MerchantSettlementItemListResult {
  list: MerchantSettlementItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantSettlementApplyCreatePayload {
  ids: number[];
  remark?: string;
}

export interface MerchantSettlementApplyCreateResult {
  apply: {
    apply_no: string;
    id: number;
  };
}

export interface MerchantSettlementApplyItem {
  apply_amount: string;
  apply_no: string;
  apply_time: number;
  audit_remark?: string;
  audit_time: number;
  id: number;
  order_count: number;
  pay_time: number;
  remark?: string;
  settlement_order_id: number;
  status: string;
  status_text: string;
}

export interface MerchantSettlementApplyListParams {
  date_from?: string;
  date_to?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MerchantSettlementApplyListResult {
  list: MerchantSettlementApplyItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantSettlementApplyDetailItem {
  biz_type: string;
  biz_type_text: string;
  current_settle_amount: string;
  id: number;
  order_sn: string;
  settle_amount: string;
  settlement_status: string;
  settlement_status_text: string;
}

export interface MerchantSettlementApplyDetail {
  apply_amount: string;
  apply_no: string;
  apply_time: number;
  audit_remark?: string;
  audit_time: number;
  id: number;
  items: MerchantSettlementApplyDetailItem[];
  order_count: number;
  pay_time: number;
  remark?: string;
  settlement_order_id: number;
  status: string;
  status_text: string;
}

export interface MerchantSettlementApplyDetailResult {
  detail: MerchantSettlementApplyDetail;
}

export interface MerchantSettlementOrderItem {
  adjust_amount: string;
  createtime: number;
  final_amount: string;
  id: number;
  order_count: number;
  pay_time: number;
  pay_voucher?: string;
  period_end?: number;
  period_start?: number;
  remark?: string;
  settle_amount: string;
  settlement_no: string;
  status: string;
  status_text: string;
}

export interface MerchantSettlementOrderListParams {
  date_from?: string;
  date_to?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MerchantSettlementOrderListResult {
  list: MerchantSettlementOrderItem[];
  page: number;
  page_size: number;
  total: number;
}

export async function getSettlementOverviewApi() {
  return requestClient.get<MerchantSettlementOverviewResult>(
    '/settlement/overview',
  );
}

export async function getSettlementItemListApi(
  params: MerchantSettlementItemListParams,
) {
  return requestClient.get<MerchantSettlementItemListResult>(
    '/settlement/item-list',
    { params },
  );
}

export async function createSettlementApplyApi(
  data: MerchantSettlementApplyCreatePayload,
) {
  return requestClient.post<MerchantSettlementApplyCreateResult>(
    '/settlement/apply-create',
    data,
  );
}

export async function getSettlementApplyListApi(
  params: MerchantSettlementApplyListParams,
) {
  return requestClient.get<MerchantSettlementApplyListResult>(
    '/settlement/apply-list',
    { params },
  );
}

export async function getSettlementApplyDetailApi(id: number) {
  return requestClient.get<MerchantSettlementApplyDetailResult>(
    '/settlement/apply-detail',
    { params: { id } },
  );
}

export async function getSettlementOrderListApi(
  params: MerchantSettlementOrderListParams,
) {
  return requestClient.get<MerchantSettlementOrderListResult>(
    '/settlement/order-list',
    { params },
  );
}
