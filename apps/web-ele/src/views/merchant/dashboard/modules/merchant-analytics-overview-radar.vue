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

const totalProducts = computed(() => {
  return (
    props.summary.line_count +
    props.summary.ticket_count +
    props.summary.goods_count
  );
});

const maxProduct = computed(() => {
  return Math.max(
    5,
    props.summary.line_count,
    props.summary.ticket_count,
    props.summary.goods_count,
  );
});

const maxOrder = computed(() => {
  return Math.max(
    5,
    props.summary.today_order_count,
    props.summary.pending_pay_count,
    props.summary.pending_verify_count,
  );
});

const options = computed(() => ({
  radar: {
    indicator: [
      { max: maxProduct.value, name: '线路' },
      { max: maxProduct.value, name: '门票' },
      { max: maxProduct.value, name: '商品' },
      { max: maxOrder.value, name: '今日订单' },
      { max: maxOrder.value, name: '待支付' },
      { max: maxOrder.value, name: '待核销' },
    ],
    radius: '64%',
  },
  series: [
    {
      areaStyle: {
        opacity: 0.2,
      },
      data: [
        {
          name: '商家经营面',
          value: [
            props.summary.line_count,
            props.summary.ticket_count,
            props.summary.goods_count,
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
    formatter() {
      return `产品总量：${totalProducts.value}`;
    },
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
