<script lang="ts" setup>
import type { DashboardSummary } from '#/api';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    summary: DashboardSummary;
  }>(),
  {
    compact: false,
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const options = computed(() => ({
  legend: {
    bottom: props.compact ? 0 : 12,
    icon: 'circle',
  },
  series: [
    {
      data: [
        { name: '线路', value: props.summary.line_count },
        { name: '门票', value: props.summary.ticket_count },
        { name: '商品', value: props.summary.goods_count },
      ],
      label: {
        formatter: '{b}: {c}',
        show: !props.compact,
      },
      radius: props.compact
        ? (['42%', '64%'] as [string, string])
        : (['38%', '68%'] as [string, string]),
      type: 'pie' as const,
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
