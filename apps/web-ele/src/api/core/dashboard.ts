import { requestClient } from '#/api/request';

export interface DashboardSummary {
  goods_count: number;
  line_count: number;
  pending_pay_count: number;
  pending_verify_count: number;
  ticket_count: number;
  today_order_count: number;
  today_turnover: number;
}

export async function getDashboardSummaryApi() {
  return requestClient.get<DashboardSummary>('/dashboard/summary');
}
