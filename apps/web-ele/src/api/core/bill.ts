import { requestClient } from '#/api/request';

export interface MerchantBillOptionItem {
  label: string;
  value: string;
}

export interface MerchantBillOrderStatusOption extends MerchantBillOptionItem {
  biz_type: string;
}

export interface MerchantBillMetaResult {
  biz_type_options: MerchantBillOptionItem[];
  cycle_type_options: MerchantBillOptionItem[];
  flow_type_options: MerchantBillOptionItem[];
  order_status_options: MerchantBillOrderStatusOption[];
  pay_type_options: MerchantBillOptionItem[];
  platform_options: MerchantBillOptionItem[];
  refund_status_options: MerchantBillOptionItem[];
}

export interface MerchantBillSummary {
  finished_amount: string;
  net_amount: string;
  order_count: number;
  paid_amount: string;
  refund_amount: string;
  refund_count: number;
}

export interface MerchantBillSummaryResult {
  summary: MerchantBillSummary;
}

export interface MerchantBillUserInfo {
  avatar?: string;
  id: number;
  mobile?: string;
  nickname?: string;
  username?: string;
}

export interface MerchantBillFlowItem {
  biz_type: string;
  biz_type_text: string;
  contact_mobile: string;
  contact_name: string;
  flow_type: string;
  flow_type_text: string;
  id: number;
  income_amount: string;
  net_amount: string;
  occur_time: number;
  occur_time_text: string;
  order_id: number;
  order_sn: string;
  order_status?: string;
  order_status_text?: string;
  pay_type?: string;
  pay_type_text?: string;
  platform?: string;
  platform_text?: string;
  refund_amount: string;
  refund_id: number;
  refund_sn: string;
  refund_status?: string;
  refund_status_text?: string;
  remark?: string;
  resource_subtitle?: string;
  resource_title?: string;
  user_info?: MerchantBillUserInfo;
}

export interface MerchantBillListResult {
  list: MerchantBillFlowItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantBillListParams {
  biz_type?: string;
  date_from?: string;
  date_to?: string;
  flow_type?: string;
  keyword?: string;
  order_status?: string;
  page?: number;
  page_size?: number;
  pay_type?: string;
  platform?: string;
  refund_status?: string;
}

export interface MerchantBillStatementItem {
  cycle_key: string;
  cycle_text: string;
  finished_amount: string;
  goods_paid_amount: string;
  line_paid_amount: string;
  net_amount: string;
  order_count: number;
  paid_amount: string;
  refund_amount: string;
  refund_count: number;
  ticket_paid_amount: string;
}

export interface MerchantBillStatementListResult {
  list: MerchantBillStatementItem[];
  page?: number;
  page_size?: number;
  total?: number;
}

export interface MerchantBillStatementListParams {
  biz_type?: string;
  cycle_type: string;
  date_from?: string;
  date_to?: string;
}

export interface MerchantBillStatementDetailParams
  extends MerchantBillListParams {
  cycle_key: string;
  cycle_type: string;
}

export interface MerchantBillStatementDetailResult
  extends MerchantBillListResult {
  cycle_key: string;
  cycle_type: string;
}

export interface MerchantBillExportParams extends MerchantBillListParams {
  cycle_type?: string;
  export_type: 'flow' | 'statement';
}

export interface MerchantBillExportResult {
  download_url: string;
  export_type: string;
  file_name: string;
  record_count: number;
  relative_path: string;
}

export async function getBillOptionsApi() {
  return requestClient.get<MerchantBillMetaResult>('/meta/bill-options');
}

export async function getBillSummaryApi(params: {
  biz_type?: string;
  date_from?: string;
  date_to?: string;
}) {
  return requestClient.get<MerchantBillSummaryResult>('/bill/summary', {
    params,
  });
}

export async function getBillListApi(params: MerchantBillListParams) {
  return requestClient.get<MerchantBillListResult>('/bill/list', {
    params,
  });
}

export async function getBillStatementListApi(
  params: MerchantBillStatementListParams,
) {
  const response = await requestClient.get<
    MerchantBillStatementItem[] | MerchantBillStatementListResult
  >('/bill/statement-list', {
    params,
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.list)) {
    return response.list;
  }

  return [];
}

export async function getBillStatementDetailApi(
  params: MerchantBillStatementDetailParams,
) {
  const response = await requestClient.get<
    MerchantBillFlowItem[] | MerchantBillStatementDetailResult
  >('/bill/statement-detail', {
    params,
  });

  if (Array.isArray(response)) {
    return {
      cycle_key: params.cycle_key,
      cycle_type: params.cycle_type,
      list: response,
      page: 1,
      page_size: response.length,
      total: response.length,
    };
  }

  return {
    cycle_key: response?.cycle_key || params.cycle_key,
    cycle_type: response?.cycle_type || params.cycle_type,
    list: Array.isArray(response?.list) ? response.list : [],
    page: response?.page || 1,
    page_size:
      response?.page_size ||
      (Array.isArray(response?.list) ? response.list.length : 0),
    total:
      response?.total ||
      (Array.isArray(response?.list) ? response.list.length : 0),
  };
}

export async function exportBillApi(params: MerchantBillExportParams) {
  return requestClient.get<MerchantBillExportResult>('/bill/export', {
    params,
  });
}
