import { requestClient } from '#/api/request';

export interface LineOptionItem {
  color?: string;
  label: string;
  value: string;
}

export interface MerchantLineItem {
  audit_remark?: string;
  audit_status: string;
  audit_status_text: string;
  createtime: number;
  desc: string;
  file: string;
  id: number;
  images: string[];
  lineday: number;
  linenight: number;
  mobile: string;
  poster: string;
  sales: number;
  status: string;
  status_text: string;
  suit_count: number;
  title: string;
  type: string;
  type_text: string;
  updatetime: number;
}

export interface MerchantLineListResult {
  list: MerchantLineItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantLineListParams {
  audit_status?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
}

export interface MerchantLineMetaResult {
  audit_status_list?: LineOptionItem[];
  end_city_options: Array<Record<string, any>>;
  line_config?: {
    content1?: string;
    content2?: string;
    content3?: string;
    content4?: string;
    content5?: string;
  };
  multi_signatory_list: LineOptionItem[];
  project_list?: Array<{
    id: number;
    name: string;
  }>;
  site_options: Array<Record<string, any>>;
  start_city_options: Array<Record<string, any>>;
  status_list: LineOptionItem[];
  tag_groups: Array<Record<string, any>>;
  type_list: LineOptionItem[];
}

export interface MerchantLineToggleStatusParams {
  id: number;
  status: string;
}

export interface MerchantLinePayload {
  content?: string;
  content1?: string;
  content2?: string;
  content3?: string;
  content4?: string;
  content5?: string;
  dayinfo?: Array<Record<string, any>>;
  desc?: string;
  endcity?: number[];
  file?: string;
  images?: string[];
  insuranceids?: number[] | string[];
  isMultiSignatory?: string;
  lineday?: number;
  linebefore?: number;
  linenight?: number;
  min_num?: number;
  mobile?: string;
  poster?: string;
  site_ids?: number[];
  startcity?: number[];
  status?: string;
  tagids?: number[];
  title?: string;
  type?: string;
  video?: string;
}

export interface MerchantLinePriceInfo {
  base_childprice: string;
  base_elderprice: string;
  base_price: string;
  bxinfo: Array<Record<string, any>>;
  childprice: string;
  date: string;
  elderprice: string;
  id: number;
  lineid: number;
  price: string;
  roomblance: string;
  roomcount: Array<Record<string, any>>;
  stock: string;
  suitid: number;
}

export interface MerchantLineSuitItem {
  child: string;
  content: string;
  createtime: number;
  id: number;
  lineid: number;
  name: string;
  oldperson: string;
  person: string;
  price: string;
  price_info?: MerchantLinePriceInfo[];
  room: string;
  updatetime: number;
}

export interface MerchantLineDetail {
  audit_admin_id?: null | number;
  audit_remark?: string;
  audit_status: string;
  audit_status_text: string;
  audit_time?: null | number;
  content: string;
  content1: string;
  content2: string;
  content3: string;
  content4: string;
  content5: string;
  createtime: number;
  dayinfo: Array<Record<string, any>>;
  desc: string;
  endcity: Array<Record<string, any>>;
  file: string;
  id: number;
  images: string[];
  insuranceids: string[];
  isMultiSignatory: string;
  lineday: number;
  linebefore: number;
  linenight: number;
  min_num: number;
  mobile: string;
  poster: string;
  sales: number;
  site_ids: Array<Record<string, any>>;
  startcity: Array<Record<string, any>>;
  status: string;
  status_text: string;
  tagids: Array<Record<string, any>>;
  title: string;
  type: string;
  type_text: string;
  updatetime: number;
  video: string;
}

export interface MerchantLineDetailResult {
  detail: MerchantLineDetail;
  suits: MerchantLineSuitItem[];
}

export interface MerchantLineCreateResult {
  detail: MerchantLineDetail;
}

export interface MerchantLineSuitListParams {
  keyword?: string;
  line_id?: number;
  page?: number;
  page_size?: number;
}

export interface MerchantLineSuitListResult {
  list: MerchantLineSuitItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantLineSuitDetailResult {
  detail: MerchantLineSuitItem;
}

export interface MerchantLineSuitPayload {
  child?: string;
  content?: string;
  id?: number;
  line_id?: number;
  lineid?: number;
  name?: string;
  oldperson?: string;
  person?: string;
  price?: string;
  priceinfo?: Array<Record<string, any>>;
  room?: string;
}

export interface MerchantLineSuitCreateResult {
  detail: MerchantLineSuitItem;
}

export async function getLineListApi(params: MerchantLineListParams) {
  return requestClient.get<MerchantLineListResult>('/line/list', { params });
}

export async function getLineOptionsApi() {
  return requestClient.get<MerchantLineMetaResult>('/meta/line-options');
}

export async function getLineDetailApi(id: number) {
  return requestClient.get<MerchantLineDetailResult>('/line/detail', {
    params: { id },
  });
}

export async function createLineApi(data: MerchantLinePayload) {
  return requestClient.post<MerchantLineCreateResult>('/line/create', data);
}

export async function updateLineApi(data: MerchantLinePayload & { id: number }) {
  return requestClient.post<MerchantLineCreateResult>('/line/update', data);
}

export async function toggleLineStatusApi(
  data: MerchantLineToggleStatusParams,
) {
  return requestClient.post('/line/toggle-status', data);
}

export async function deleteLineApi(id: number) {
  return requestClient.post('/line/delete', { id });
}

export async function getLineSuitListApi(params: MerchantLineSuitListParams) {
  return requestClient.get<MerchantLineSuitListResult>('/line/suit/list', {
    params,
  });
}

export async function getLineSuitDetailApi(id: number) {
  return requestClient.get<MerchantLineSuitDetailResult>('/line/suit/detail', {
    params: { id },
  });
}

export async function createLineSuitApi(data: MerchantLineSuitPayload) {
  return requestClient.post<MerchantLineSuitCreateResult>('/line/suit/create', data);
}

export async function updateLineSuitApi(data: MerchantLineSuitPayload) {
  return requestClient.post<MerchantLineSuitCreateResult>('/line/suit/update', data);
}

export async function deleteLineSuitApi(id: number) {
  return requestClient.post('/line/suit/delete', { id });
}
