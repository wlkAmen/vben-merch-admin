import { requestClient } from '#/api/request';

export interface MerchantLineOrderItem {
  createtime: number;
  date: string;
  id: number;
  line_id: number;
  line_title: string;
  mobile: string;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  realname: string;
  refund_id: number;
  status: string;
  status_text: string;
  total_fee: string;
  user_info?: MerchantOrderUserInfo;
}

export interface MerchantLineOrderListResult {
  list: MerchantLineOrderItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantLineOrderListParams {
  date_from?: string;
  date_to?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export interface MerchantOrderRefundInfo {
  createtime: number;
  finishtime: number;
  id: number;
  reason: string;
  refund_fee: string;
  refund_sn: string;
  refund_status: string;
  refund_status_text: string;
  status: string;
  status_text: string;
  type: string;
  type_text: string;
}

export interface MerchantOrderUserInfo {
  avatar?: string;
  id: number;
  mobile?: string;
  nickname?: string;
  username?: string;
}

export interface MerchantLineProjectOrderInfo {
  id: number;
  order_sn: string;
  project_id: number;
  project_name: string;
  project_price: string;
  status: string;
  status_text: string;
  total_fee: string;
}

export interface MerchantLineOrderPassenger {
  gender?: number;
  idcard?: string;
  idtype?: number;
  mobile?: string;
  realname?: string;
}

export interface MerchantLineOrderBxInfo {
  name?: string;
  price?: number | string;
}

export interface MerchantLineOrderLineInfo {
  id?: number;
  title?: string;
}

export interface MerchantLineOrderSiteInfo {
  id?: number;
  name?: string;
}

export interface MerchantLineOrderSuitInfo {
  id?: number;
  name?: string;
}

export interface MerchantLineOrderDetail {
  adult_num: number;
  adult_price: string;
  bx_fee: string;
  bx_info: MerchantLineOrderBxInfo[];
  child_num: number;
  child_price: string;
  createtime: number;
  date: string;
  elder_num: number;
  elder_price: string;
  finishtime: number;
  id: number;
  line_info?: MerchantLineOrderLineInfo;
  mobile: string;
  order_sn: string;
  passengers: MerchantLineOrderPassenger[];
  pay_fee: string;
  pay_cert?: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  price: string;
  project_fee: string;
  project_orders: MerchantLineProjectOrderInfo[];
  realname: string;
  refund?: MerchantOrderRefundInfo | null;
  refund_fee: string;
  remark: string;
  room_fee: string;
  room_num: number;
  room_price: string;
  site_json?: MerchantLineOrderSiteInfo | null;
  status: string;
  status_text: string;
  suit_info?: MerchantLineOrderSuitInfo;
  total_fee: string;
  transaction_id: string;
  user_info?: MerchantOrderUserInfo;
}

export interface MerchantLineOrderDetailResult {
  detail: MerchantLineOrderDetail;
}

export interface MerchantLineContractInfo {
  QRCodeURL?: string;
  content?: string;
  contractNumber?: string;
  createtime?: number;
  error_message?: string;
  fileURL?: string;
  id?: number;
  invalidetime?: number;
  invalidetime_text?: string;
  order_id?: number;
  signedtime?: number;
  signedtime_text?: string;
  signStatus?: string;
  signStatus_text?: string;
  signingURL?: string;
  state?: string;
  state_text?: string;
  updatetime?: number;
}

export interface MerchantLineContractDetail {
  can_invalid: boolean;
  can_repeat: boolean;
  can_repeat_invalid: boolean;
  can_send: boolean;
  contract: MerchantLineContractInfo | null;
  contract_enabled: boolean;
  order_id: number;
  order_sn: string;
  status: string;
  status_text: string;
}

export interface MerchantLineContractDetailResult {
  detail: MerchantLineContractDetail;
}

export interface MerchantTicketOrderVerifyInfo {
  code?: string;
  id?: number;
  merch_id?: number;
  saler_id?: number;
  status?: string;
  status_text?: string;
  verifytime?: number;
}

export interface MerchantTicketOrderPassenger {
  gender?: number;
  idcard?: string;
  idtype?: number;
  mobile?: string;
  realname?: string;
}

export interface MerchantTicketOrderSuitInfo {
  id?: number;
  name?: string;
}

export interface MerchantTicketOrderTicketInfo {
  id?: number;
  title?: string;
}

export interface MerchantTicketOrderItem {
  createtime: number;
  date: string;
  id: number;
  mobile: string;
  number: number;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  realname: string;
  refund_fee?: string;
  refund_id?: number;
  status: string;
  status_text: string;
  suit_id?: number;
  suit_name?: string;
  suit_title?: string;
  ticket_id?: number;
  ticket_title?: string;
  title?: string;
  total_fee: string;
  user_info?: MerchantOrderUserInfo;
  verify_info?: MerchantTicketOrderVerifyInfo | MerchantTicketOrderVerifyInfo[] | null;
  verify_status?: string;
  verify_status_text?: string;
}

export interface MerchantTicketOrderListResult {
  list: MerchantTicketOrderItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantTicketOrderDetail {
  createtime: number;
  date: string;
  finishtime: number;
  id: number;
  mobile: string;
  number: number;
  order_sn: string;
  passengers: MerchantTicketOrderPassenger[];
  pay_fee: string;
  pay_cert?: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  price: string;
  realname: string;
  refund?: MerchantOrderRefundInfo | null;
  refund_fee: string;
  remark: string;
  status: string;
  status_text: string;
  suit_info?: MerchantTicketOrderSuitInfo;
  ticket_info?: MerchantTicketOrderTicketInfo;
  total_fee: string;
  transaction_id?: string;
  user_info?: MerchantOrderUserInfo;
  verify_info?: MerchantTicketOrderVerifyInfo | null;
}

export interface MerchantTicketOrderDetailResult {
  detail: MerchantTicketOrderDetail;
}

export interface MerchantExpressOptionItem {
  code: string;
  id: number;
  name: string;
}

export interface MerchantExpressOptionsResult {
  express_options: MerchantExpressOptionItem[];
}

export interface MerchantGoodsOrderItem {
  consignee?: string;
  createtime: number;
  id: number;
  mobile?: string;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  realname?: string;
  receiver_name?: string;
  status: string;
  status_text: string;
  total_fee: string;
  type?: string;
  type_text?: string;
  user_info?: MerchantOrderUserInfo;
}

export interface MerchantGoodsOrderListResult {
  list: MerchantGoodsOrderItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MerchantGoodsOrderDetailItem {
  aftersale_status?: string;
  aftersale_status_text?: string;
  dispatch_fee?: string;
  dispatch_status?: string;
  dispatch_status_text?: string;
  goods_id?: number;
  goods_num?: number;
  goods_price?: string;
  goods_sku_text?: string;
  goods_title?: string;
  id: number;
  pay_price?: string;
  refund_status?: string;
  refund_status_text?: string;
  refund_fee?: string;
}

export interface MerchantGoodsOrderExpressItem {
  createtime?: number;
  express_code?: string;
  express_name?: string;
  express_no?: string;
  id: number;
}

export interface MerchantGoodsOrderDetail {
  address?: string;
  city_name?: string;
  consignee?: string;
  createtime: number;
  dispatch_amount?: string;
  district_name?: string;
  express: MerchantGoodsOrderExpressItem[];
  finishtime?: number;
  goods_amount?: string;
  id: number;
  items: MerchantGoodsOrderDetailItem[];
  mobile?: string;
  order_sn: string;
  pay_fee: string;
  pay_type: string;
  pay_type_text: string;
  paytime: number;
  platform: string;
  platform_text: string;
  province_name?: string;
  remark?: string;
  sendtime?: number;
  status: string;
  status_text: string;
  total_amount?: string;
  total_fee: string;
  transaction_id?: string;
  type?: string;
  type_text?: string;
  user_info?: MerchantOrderUserInfo;
}

export interface MerchantGoodsOrderDetailResult {
  detail: MerchantGoodsOrderDetail;
}

export interface MerchantOrderPayPayload {
  id: number;
  pay_cert?: string;
}

export interface MerchantGoodsOrderSendPayload {
  express_id: number;
  express_no: string;
  id: number;
}

export interface MerchantLineContractActionPayload {
  id: number;
  type: 'invalid' | 'repeat' | 'repeatInvalid' | 'send';
}

export async function getLineOrderListApi(params: MerchantLineOrderListParams) {
  return requestClient.get<MerchantLineOrderListResult>('/order/line/list', {
    params,
  });
}

export async function getLineOrderDetailApi(id: number) {
  return requestClient.get<MerchantLineOrderDetailResult>('/order/line/detail', {
    params: { id },
  });
}

export async function payLineOrderApi(data: MerchantOrderPayPayload) {
  return requestClient.post<MerchantLineOrderDetailResult>('/order/line/pay', data);
}

export async function finishLineOrderApi(id: number) {
  return requestClient.post<MerchantLineOrderDetailResult>('/order/line/finish', {
    id,
  });
}

export async function getLineContractDetailApi(id: number) {
  return requestClient.get<MerchantLineContractDetailResult>(
    '/order/line/contract-detail',
    {
      params: { id },
    },
  );
}

export async function actionLineContractApi(
  data: MerchantLineContractActionPayload,
) {
  return requestClient.post<MerchantLineContractDetailResult>(
    '/order/line/contract-action',
    data,
  );
}

export async function getTicketOrderListApi(params: MerchantLineOrderListParams) {
  return requestClient.get<MerchantTicketOrderListResult>('/order/ticket/list', {
    params,
  });
}

export async function getTicketOrderDetailApi(id: number) {
  return requestClient.get<MerchantTicketOrderDetailResult>(
    '/order/ticket/detail',
    {
      params: { id },
    },
  );
}

export async function payTicketOrderApi(data: MerchantOrderPayPayload) {
  return requestClient.post<MerchantTicketOrderDetailResult>(
    '/order/ticket/pay',
    data,
  );
}

export async function finishTicketOrderApi(id: number) {
  return requestClient.post<MerchantTicketOrderDetailResult>(
    '/order/ticket/finish',
    { id },
  );
}

export async function getGoodsOrderListApi(params: MerchantLineOrderListParams) {
  return requestClient.get<MerchantGoodsOrderListResult>('/order/goods/list', {
    params,
  });
}

export async function getGoodsOrderDetailApi(id: number) {
  return requestClient.get<MerchantGoodsOrderDetailResult>('/order/goods/detail', {
    params: { id },
  });
}

export async function getExpressOptionsApi() {
  return requestClient.get<MerchantExpressOptionsResult>('/meta/express-options');
}

export async function sendGoodsOrderApi(data: MerchantGoodsOrderSendPayload) {
  return requestClient.post<MerchantGoodsOrderDetailResult>('/order/goods/send', data);
}

export async function finishGoodsOrderApi(id: number) {
  return requestClient.post<MerchantGoodsOrderDetailResult>(
    '/order/goods/finish',
    { id },
  );
}
