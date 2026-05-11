<script lang="ts" setup>
import type { DashboardSummary } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisChartCard, Page, VbenAvatar } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { preferences } from '@vben/preferences';

import { ElButton, ElMessage, ElTag } from 'element-plus';

import { getDashboardSummaryApi } from '#/api';
import { useAuthStore } from '#/store';

import MerchantAnalyticsOrders from './modules/merchant-analytics-orders.vue';

defineOptions({ name: 'MerchantDashboardPage' });

interface NavItem {
  color: string;
  description: string;
  icon: string;
  title: string;
  url: string;
}

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const lastUpdatedAt = ref('');

const summary = ref<DashboardSummary>({
  goods_count: 0,
  line_count: 0,
  pending_pay_count: 0,
  pending_verify_count: 0,
  ticket_count: 0,
  today_order_count: 0,
  today_turnover: 0,
});

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatAmount(value: number | string | undefined) {
  return Number(value || 0).toFixed(2);
}

const merchantName = computed(() => {
  return authStore.currentMerchant?.name || '商家工作台';
});

const adminName = computed(() => {
  return (
    authStore.currentAdmin?.nickname ||
    authStore.currentAdmin?.username ||
    '未识别账号'
  );
});

const totalProductCount = computed(() => {
  return (
    summary.value.line_count +
    summary.value.ticket_count +
    summary.value.goods_count
  );
});

const pendingTaskCount = computed(() => {
  return summary.value.pending_pay_count + summary.value.pending_verify_count;
});

const overviewCards = computed(() => [
  {
    description: '包含线路、门票、商品在内的当日成交结果。',
    icon: 'lucide:wallet',
    label: '今日成交额',
    value: `${formatAmount(summary.value.today_turnover)} 元`,
  },
  {
    description: '待支付订单与待核销订单的合计数量。',
    icon: 'lucide:alarm-clock',
    label: '待跟进事项',
    value: `${pendingTaskCount.value} 项`,
  },
  {
    description: '今日进入流转中的订单数量。',
    icon: 'lucide:receipt-text',
    label: '今日订单',
    value: `${summary.value.today_order_count} 单`,
  },
  {
    description: '当前在售线路、门票、商品总量。',
    icon: 'lucide:package-search',
    label: '产品总量',
    value: `${totalProductCount.value} 个`,
  },
]);

const quickActions = computed<NavItem[]>(() => [
  {
    color: 'bg-blue-500/10 text-blue-600',
    description: '查看经营指标与走势分析',
    icon: 'lucide:chart-column-big',
    title: '分析页',
    url: '/analytics',
  },
  {
    color: 'bg-teal-500/10 text-teal-600',
    description: '维护线路产品与套餐信息',
    icon: 'lucide:route',
    title: '线路列表',
    url: '/line/list',
  },
  {
    color: 'bg-amber-500/10 text-amber-600',
    description: '管理景区门票与票种库存',
    icon: 'lucide:ticket',
    title: '门票列表',
    url: '/ticket/list',
  },
  {
    color: 'bg-violet-500/10 text-violet-600',
    description: '维护零售商品与发货流程',
    icon: 'lucide:shopping-bag',
    title: '商品列表',
    url: '/goods/list',
  },
  {
    color: 'bg-rose-500/10 text-rose-600',
    description: '进入订单中心处理日常履约',
    icon: 'lucide:scroll-text',
    title: '订单中心',
    url: '/order/line',
  },
  {
    color: 'bg-emerald-500/10 text-emerald-600',
    description: '查看待结算明细、申请和结算单',
    icon: 'lucide:hand-coins',
    title: '结算中心',
    url: '/finance/settlement',
  },
]);

const pendingItems = computed(() => [
  {
    count: summary.value.pending_pay_count,
    description: '建议优先关注临近超时的待支付订单。',
    icon: 'lucide:wallet-cards',
    title: '待支付订单',
    url: '/order/line',
  },
  {
    count: summary.value.pending_verify_count,
    description: '适合提前安排客服与现场接待。',
    icon: 'lucide:badge-check',
    title: '待核销订单',
    url: '/verify/query',
  },
  {
    count: totalProductCount.value,
    description: '定期检查在售产品结构、库存和定价。',
    icon: 'lucide:boxes',
    title: '在售产品总量',
    url: '/goods/list',
  },
]);

const handlingSuggestions = computed(() => [
  {
    description: `当前有 ${summary.value.pending_pay_count} 笔待支付订单，建议优先跟进临近超时订单。`,
    icon: 'lucide:wallet-cards',
    title: '支付转化',
  },
  {
    description: `当前有 ${summary.value.pending_verify_count} 笔待核销订单，适合提前安排客服与现场接待。`,
    icon: 'lucide:badge-check',
    title: '核销履约',
  },
  {
    description: `当前在售产品共 ${totalProductCount.value} 个，建议定期检查库存、价格和内容完整度。`,
    icon: 'lucide:package-search',
    title: '产品维护',
  },
]);

const merchantSnapshot = computed(() => [
  {
    label: '商家名称',
    value: merchantName.value,
  },
  {
    label: '商家状态',
    value: authStore.currentMerchant?.status_text || '-',
  },
  {
    label: '商家类型',
    value: authStore.currentMerchant?.type_text || '-',
  },
  {
    label: '联系电话',
    value: authStore.currentMerchant?.mobile || '-',
  },
  {
    label: '管理员',
    value: adminName.value,
  },
  {
    label: '最近登录',
    value: authStore.currentAdmin?.logintime_text || '-',
  },
]);

function navTo(url?: string) {
  if (!url) {
    return;
  }

  router.push(url).catch((error) => {
    console.error('Navigation failed:', error);
  });
}

async function loadSummary() {
  loading.value = true;
  try {
    summary.value = await getDashboardSummaryApi();
    lastUpdatedAt.value = formatDateTime();
  } catch (error) {
    console.error(error);
    ElMessage.error('工作台数据加载失败，请稍后重试');
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
    <div v-loading="loading" class="flex flex-col gap-4">
      <section
        class="border-border bg-background rounded-2xl border px-5 py-5 shadow-sm"
      >
        <div
          class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
        >
          <div class="flex min-w-0 items-start gap-4">
            <VbenAvatar
              :src="
                authStore.currentAdmin?.avatar ||
                authStore.currentMerchant?.logo ||
                preferences.app.defaultAvatar
              "
              class="mt-0.5 size-16 shrink-0"
            />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-foreground truncate text-xl font-semibold">
                  {{ merchantName }}
                </h1>
                <ElTag size="small" type="success">工作台</ElTag>
              </div>
              <p class="text-muted-foreground mt-2 text-sm leading-6">
                当前登录账号为
                {{
                  adminName
                }}，聚合今日订单、待办任务和产品状态，方便快速处理日常经营事务。
              </p>
              <div
                class="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
              >
                <span class="inline-flex items-center gap-1.5">
                  <IconifyIcon icon="lucide:clock-3" />
                  最近登录：{{ authStore.currentAdmin?.logintime_text || '-' }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <IconifyIcon icon="lucide:refresh-cw" />
                  数据更新：{{ lastUpdatedAt || '-' }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[420px] xl:max-w-[520px]"
          >
            <div class="bg-muted/35 rounded-xl px-4 py-3">
              <p class="text-muted-foreground text-xs">待支付</p>
              <p class="mt-2 text-2xl font-semibold">
                {{ summary.pending_pay_count }}
              </p>
            </div>
            <div class="bg-muted/35 rounded-xl px-4 py-3">
              <p class="text-muted-foreground text-xs">待核销</p>
              <p class="mt-2 text-2xl font-semibold">
                {{ summary.pending_verify_count }}
              </p>
            </div>
            <div class="bg-muted/35 rounded-xl px-4 py-3">
              <p class="text-muted-foreground text-xs">今日订单</p>
              <p class="mt-2 text-2xl font-semibold">
                {{ summary.today_order_count }}
              </p>
            </div>
            <div class="bg-muted/35 rounded-xl px-4 py-3">
              <p class="text-muted-foreground text-xs">产品总量</p>
              <p class="mt-2 text-2xl font-semibold">
                {{ totalProductCount }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <div
          v-for="item in overviewCards"
          :key="item.label"
          class="border-border bg-background rounded-2xl border px-4 py-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-muted-foreground text-sm">{{ item.label }}</p>
              <p class="mt-2 text-2xl font-semibold">{{ item.value }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-2.5">
              <IconifyIcon :icon="item.icon" class="text-lg" />
            </div>
          </div>
          <p class="text-muted-foreground mt-3 text-xs leading-5">
            {{ item.description }}
          </p>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-3">
        <AnalysisChartCard title="待办事项">
          <div class="flex flex-col gap-3">
            <button
              v-for="item in pendingItems"
              :key="item.title"
              class="border-border hover:border-primary/40 flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              type="button"
              @click="navTo(item.url)"
            >
              <span
                class="bg-muted/50 text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
              >
                <IconifyIcon :icon="item.icon" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-3">
                  <span class="text-sm font-medium">{{ item.title }}</span>
                  <span class="text-primary text-base font-semibold">
                    {{ item.count }}
                  </span>
                </span>
                <span
                  class="text-muted-foreground mt-1 block text-xs leading-5"
                >
                  {{ item.description }}
                </span>
              </span>
            </button>
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard title="快捷入口">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <button
              v-for="item in quickActions"
              :key="item.title"
              class="border-border hover:border-primary/40 hover:bg-primary/5 flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              type="button"
              @click="navTo(item.url)"
            >
              <span
                :class="item.color"
                class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-lg"
              >
                <IconifyIcon :icon="item.icon" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium">{{ item.title }}</span>
                <span
                  class="text-muted-foreground mt-1 block text-xs leading-5"
                >
                  {{ item.description }}
                </span>
              </span>
            </button>
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard title="订单处理概览">
          <MerchantAnalyticsOrders :summary="summary" />
        </AnalysisChartCard>

        <AnalysisChartCard class="xl:col-span-2" title="今日处理建议">
          <div class="grid gap-3 md:grid-cols-3">
            <div
              v-for="item in handlingSuggestions"
              :key="item.title"
              class="bg-muted/30 rounded-xl px-4 py-4"
            >
              <div class="flex items-center gap-2 text-sm font-medium">
                <IconifyIcon :icon="item.icon" />
                {{ item.title }}
              </div>
              <p class="text-muted-foreground mt-2 text-xs leading-5">
                {{ item.description }}
              </p>
            </div>
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard title="商家快照">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div
              v-for="item in merchantSnapshot"
              :key="item.label"
              class="bg-muted/30 rounded-xl px-4 py-3"
            >
              <p class="text-muted-foreground text-xs">{{ item.label }}</p>
              <p class="mt-1.5 break-all text-sm font-medium leading-6">
                {{ item.value }}
              </p>
            </div>
          </div>

          <template #extra>
            <ElButton link type="primary" @click="navTo('/setting/merchant')">
              商家设置
            </ElButton>
          </template>
        </AnalysisChartCard>
      </section>
    </div>
  </Page>
</template>
