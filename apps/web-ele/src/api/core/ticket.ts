import { requestClient } from '#/api/request';

export interface TicketOptionItem {
  label: string;
  value: number | string;
}

export interface MerchantTicketItem {
  address: string;
  createtime: number;
  desc: string;
  id: number;
  images: string[];
  merchant_suit_count: number;
  mobile: string;
  opentime: string;
  sellpoint: string;
  status: string;
  status_text: string;
  title: string;
  updatetime: number;
  video: string;
}

export interface MerchantTicketListResult {
  list: MerchantTicketItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantTicketListParams {
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MerchantTicketMetaResult {
  category_options: Array<Record<string, any>>;
  level_options: Array<{
    id: number;
    name: string;
  }>;
  passenger_options: TicketOptionItem[];
  status_list: TicketOptionItem[];
  ticket_config?: {
    content1?: string;
    content2?: string;
    content3?: string;
    content4?: string;
    content5?: string;
  };
  ticket_options: Array<{
    id: number;
    status: string;
    title: string;
  }>;
  type_options: Array<{
    id: number;
    name: string;
  }>;
}

export interface MerchantTicketPriceInfo {
  base_price: string;
  date: string;
  id: number;
  price: string;
  stock: string;
  suit_id: number;
  ticket_id: number;
}

export interface MerchantTicketSuitItem {
  audit_admin_id?: null | number;
  audit_remark?: string;
  audit_status: string;
  audit_status_text: string;
  audit_time?: null | number;
  before: number;
  beforetime: string;
  content: string;
  createtime: number;
  explain: string;
  id: number;
  merch_id: string;
  name: string;
  passenger: string;
  price: string;
  price_info?: MerchantTicketPriceInfo[];
  tags: string[];
  ticket_id: number;
  type_id: string;
  updatetime: number;
}

export interface MerchantTicketDetail {
  address: string;
  category_ids: Array<number | string>;
  content1: string;
  content2: string;
  content3: string;
  content4: string;
  content5: string;
  createtime: number;
  desc: string;
  endcity: Array<Record<string, any>>;
  id: number;
  images: string[];
  lat: string;
  level_id: string;
  level_text: string;
  lng: string;
  mobile: string;
  opentime: string;
  sellpoint: string;
  status: string;
  status_text: string;
  tags: string[];
  title: string;
  updatetime: number;
  video: string;
}

export interface MerchantTicketDetailResult {
  detail: MerchantTicketDetail;
  merchant_suits: MerchantTicketSuitItem[];
}

export interface MerchantTicketSuitListParams {
  audit_status?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  ticket_id?: number;
}

export interface MerchantTicketSuitListResult {
  list: MerchantTicketSuitItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantTicketSuitDetailResult {
  detail: MerchantTicketSuitItem;
}

export interface MerchantTicketSuitPayload {
  before?: number;
  beforetime?: string;
  content?: string;
  explain?: string;
  id?: number;
  name?: string;
  passenger?: string;
  price?: string;
  priceinfo?: Array<Record<string, any>>;
  tags?: string[];
  ticket_id?: number;
  ticketId?: number;
  type_id?: number | string;
}

export async function getTicketOptionsApi() {
  return requestClient.get<MerchantTicketMetaResult>('/meta/ticket-options');
}

export async function getTicketListApi(params: MerchantTicketListParams) {
  return requestClient.get<MerchantTicketListResult>('/ticket/list', {
    params,
  });
}

export async function getTicketDetailApi(id: number) {
  return requestClient.get<MerchantTicketDetailResult>('/ticket/detail', {
    params: { id },
  });
}

export async function getTicketSuitListApi(params: MerchantTicketSuitListParams) {
  return requestClient.get<MerchantTicketSuitListResult>('/ticket/suit/list', {
    params,
  });
}

export async function getTicketSuitDetailApi(id: number) {
  return requestClient.get<MerchantTicketSuitDetailResult>('/ticket/suit/detail', {
    params: { id },
  });
}

export async function createTicketSuitApi(data: MerchantTicketSuitPayload) {
  return requestClient.post<MerchantTicketSuitDetailResult>('/ticket/suit/create', data);
}

export async function updateTicketSuitApi(data: MerchantTicketSuitPayload) {
  return requestClient.post<MerchantTicketSuitDetailResult>('/ticket/suit/update', data);
}

export async function deleteTicketSuitApi(id: number) {
  return requestClient.post('/ticket/suit/delete', { id });
}
