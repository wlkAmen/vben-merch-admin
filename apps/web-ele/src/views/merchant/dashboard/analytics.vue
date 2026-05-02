<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import type { DashboardSummary } from '#/api';

import { computed, onMounted, ref } from 'vue';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
  Page,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { ElMessage } from 'element-plus';

import { getDashboardSummaryApi } from '#/api';

import MerchantAnalyticsMetrics from './modules/merchant-analytics-metrics.vue';
import MerchantAnalyticsOrders from './modules/merchant-analytics-orders.vue';
import MerchantAnalyticsOverviewRadar from './modules/merchant-analytics-overview-radar.vue';
import MerchantAnalyticsProducts from './modules/merchant-analytics-products.vue';
import MerchantAnalyticsRevenue from './modules/merchant-analytics-revenue.vue';

defineOptions({ name: 'MerchantAnalyticsPage' });

const loading = ref(false);
const summary = ref<DashboardSummary>({
  goods_count: 0,
  line_count: 0,
  pending_pay_count: 0,
  pending_verify_count: 0,
  ticket_count: 0,
  today_order_count: 0,
  today_turnover: 0,
});

const totalProductCount = computed(() => {
  return (
    summary.value.line_count +
    summary.value.ticket_count +
    summary.value.goods_count
  );
});

const overviewItems = computed<AnalysisOverviewItem[]>(() => [
  {
    icon: SvgCardIcon,
    title: '今日成交额',
    totalTitle: '产品总量',
    totalValue: totalProductCount.value,
    value: Number(summary.value.today_turnover || 0),
  },
  {
    icon: SvgCakeIcon,
    title: '今日订单数',
    totalTitle: '待支付订单',
    totalValue: summary.value.pending_pay_count,
    value: summary.value.today_order_count,
  },
  {
    icon: SvgDownloadIcon,
    title: '待核销订单',
    totalTitle: '门票数量',
    totalValue: summary.value.ticket_count,
    value: summary.value.pending_verify_count,
  },
  {
    icon: SvgBellIcon,
    title: '商品数量',
    totalTitle: '线路数量',
    totalValue: summary.value.line_count,
    value: summary.value.goods_count,
  },
]);

const chartTabs: TabOption[] = [
  {
    label: '经营指标',
    value: 'metrics',
  },
  {
    label: '产品结构',
    value: 'products',
  },
];

async function loadSummary() {
  loading.value = true;
  try {
    summary.value = await getDashboardSummaryApi();
  } catch (error) {
    console.error(error);
    ElMessage.error('分析页数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSummary();
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col gap-4">
    <div v-loading="loading">
      <AnalysisOverview :items="overviewItems" />
    </div>

    <AnalysisChartsTabs :tabs="chartTabs" class="mt-1">
      <template #metrics>
        <MerchantAnalyticsMetrics :summary="summary" />
      </template>
      <template #products>
        <MerchantAnalyticsProducts :summary="summary" />
      </template>
    </AnalysisChartsTabs>

    <div class="mt-1 w-full md:flex">
      <AnalysisChartCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" title="订单压力">
        <MerchantAnalyticsOrders :summary="summary" />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" title="产品结构">
        <MerchantAnalyticsProducts :summary="summary" compact />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="经营结果">
        <MerchantAnalyticsRevenue :summary="summary" />
      </AnalysisChartCard>
    </div>

    <AnalysisChartCard title="经营雷达">
      <MerchantAnalyticsOverviewRadar :summary="summary" />
    </AnalysisChartCard>
  </Page>
</template>
