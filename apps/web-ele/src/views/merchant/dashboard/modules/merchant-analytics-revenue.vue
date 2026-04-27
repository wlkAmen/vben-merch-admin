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
  radar: {
    indicator: [
      { max: Math.max(100, Number(props.summary.today_turnover || 0)), name: '成交额' },
      { max: Math.max(10, props.summary.today_order_count), name: '订单数' },
      { max: Math.max(10, props.summary.pending_pay_count), name: '待支付' },
      { max: Math.max(10, props.summary.pending_verify_count), name: '待核销' },
    ],
    radius: '62%',
  },
  series: [
    {
      areaStyle: {
        opacity: 0.25,
      },
      data: [
        {
          name: '经营结果',
          value: [
            Number(props.summary.today_turnover || 0),
            props.summary.today_order_count,
            props.summary.pending_pay_count,
            props.summary.pending_verify_count,
          ],
        },
      ],
      type: 'radar' as const,
    },
  ],
  tooltip: {
    trigger: 'item' as const,
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
