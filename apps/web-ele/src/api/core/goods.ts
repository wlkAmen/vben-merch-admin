import { requestClient } from '#/api/request';

export interface GoodsOptionItem {
  label: string;
  value: string;
}

export interface MerchantGoodsDispatchOption {
  id: number;
  name: string;
  status: string;
  status_text: string;
  type: string;
  type_text: string;
}

export interface MerchantGoodsItem {
  audit_remark?: string;
  audit_status: string;
  audit_status_text: string;
  createtime: number;
  id: number;
  image: string;
  images: string[];
  is_sku: number;
  price: string;
  sales: number;
  status: string;
  status_text: string;
  stock: number;
  subtitle: string;
  title: string;
  type: string;
  type_text: string;
  updatetime: number;
}

export interface MerchantGoodsListResult {
  list: MerchantGoodsItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantGoodsListParams {
  audit_status?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
}

export interface MerchantGoodsMetaResult {
  audit_status_list?: GoodsOptionItem[];
  category_options: Array<Record<string, any>>;
  dispatch_options: MerchantGoodsDispatchOption[];
  status_list: GoodsOptionItem[];
  type_list: GoodsOptionItem[];
}

export interface MerchantGoodsParamItem {
  content: string;
  title: string;
}

export interface MerchantGoodsDetail {
  audit_admin_id?: null | number;
  audit_remark?: string;
  audit_status: string;
  audit_status_text: string;
  audit_time?: null | number;
  category_ids: Array<number | string>;
  content: string;
  createtime: number;
  dispatch_id: number;
  dispatch_type: string;
  id: number;
  image: string;
  images: string[];
  is_sku: number;
  likes: number;
  original_price: string;
  params: MerchantGoodsParamItem[];
  price: string;
  sales: number;
  status: string;
  status_text: string;
  stock: number;
  subtitle: string;
  title: string;
  type: string;
  type_text: string;
  updatetime: number;
  views: number;
}

export interface MerchantGoodsSingleSkuDetail {
  id: number;
  price: string;
  sn: string;
  status: string;
  stock: number;
  weight: string;
}

export interface MerchantGoodsSkuNode {
  children: MerchantGoodsSkuNode[];
  id: number;
  name: string;
  pid: number;
}

export interface MerchantGoodsSkuPriceRow {
  cost_price?: null | string;
  goods_sku_ids: string[];
  goods_sku_text: string[];
  id: number;
  image: string;
  original_price?: null | string;
  price: string;
  sn: string;
  status: string;
  stock: number;
  weight: string;
}

export interface MerchantGoodsSkuPayload {
  detail?: MerchantGoodsSingleSkuDetail | null;
  list?: MerchantGoodsSkuNode[];
  mode: 'multiple' | 'single';
  price?: MerchantGoodsSkuPriceRow[];
}

export interface MerchantGoodsDetailResult {
  detail: MerchantGoodsDetail;
  sku: MerchantGoodsSkuPayload;
}

export interface MerchantGoodsPayload {
  category_ids?: Array<number | string>;
  content?: string;
  dispatch_id?: number;
  dispatch_type?: string;
  id?: number;
  image?: string;
  images?: string[];
  is_sku?: number;
  original_price?: number | string;
  params?: MerchantGoodsParamItem[];
  price?: number | string;
  sn?: string;
  status?: string;
  stock?: number;
  subtitle?: string;
  title?: string;
  type?: string;
  weight?: number | string;
}

export interface MerchantGoodsSkuSavePayload {
  goods_id: number;
  listData: Array<Record<string, any>>;
  priceData: Array<Record<string, any>>;
}

export interface MerchantGoodsSkuDetailParams {
  goods_id: number;
}

export async function getGoodsOptionsApi() {
  return requestClient.get<MerchantGoodsMetaResult>('/meta/goods-options');
}

export async function getGoodsListApi(params: MerchantGoodsListParams) {
  return requestClient.get<MerchantGoodsListResult>('/goods/list', {
    params,
  });
}

export async function getGoodsDetailApi(id: number) {
  return requestClient.get<MerchantGoodsDetailResult>('/goods/detail', {
    params: { id },
  });
}

export async function createGoodsApi(data: MerchantGoodsPayload) {
  return requestClient.post<MerchantGoodsDetailResult>('/goods/create', data);
}

export async function updateGoodsApi(data: MerchantGoodsPayload & { id: number }) {
  return requestClient.post<MerchantGoodsDetailResult>('/goods/update', data);
}

export async function toggleGoodsStatusApi(data: { id: number; status: string }) {
  return requestClient.post('/goods/toggle-status', data);
}

export async function getGoodsSkuDetailApi(params: MerchantGoodsSkuDetailParams) {
  return requestClient.get<MerchantGoodsSkuPayload>('/goods/sku/detail', {
    params,
  });
}

export async function saveGoodsSkuApi(data: MerchantGoodsSkuSavePayload) {
  return requestClient.post<MerchantGoodsSkuPayload>('/goods/sku/save', data);
}
