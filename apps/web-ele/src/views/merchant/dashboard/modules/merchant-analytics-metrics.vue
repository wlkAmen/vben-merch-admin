<script lang="ts" setup>
import type { DashboardSummary } from '#/api';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  summary: DashboardSummary;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const options = computed(() => ({
  grid: {
    bottom: 0,
    containLabel: true,
    left: '1%',
    right: '1%',
    top: '4%',
  },
  series: [
    {
      barMaxWidth: 60,
      data: [
        Number(props.summary.today_turnover || 0),
        props.summary.today_order_count,
        props.summary.pending_pay_count,
        props.summary.pending_verify_count,
      ],
      itemStyle: {
        color: '#2563eb',
      },
      type: 'bar' as const,
    },
  ],
  tooltip: {
    trigger: 'axis' as const,
  },
  xAxis: {
    data: ['今日成交额', '今日订单', '待支付', '待核销'],
    type: 'category' as const,
  },
  yAxis: {
    splitNumber: 4,
    type: 'value' as const,
  },
}));

watch(
  options,
  (value) => {
    renderEcharts(value);
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
