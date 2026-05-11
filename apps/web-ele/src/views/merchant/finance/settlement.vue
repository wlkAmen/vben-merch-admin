<script lang="ts" setup>
import type {
  MerchantSettlementApplyDetail,
  MerchantSettlementApplyItem,
  MerchantSettlementItem,
  MerchantSettlementOrderItem,
  MerchantSettlementOverview,
} from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElImage,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  createSettlementApplyApi,
  getSettlementApplyDetailApi,
  getSettlementApplyListApi,
  getSettlementItemListApi,
  getSettlementOrderListApi,
  getSettlementOverviewApi,
} from '#/api';

defineOptions({ name: 'MerchantFinanceSettlementPage' });

type SettlementTab = 'apply' | 'item' | 'order';

const activeTab = ref<SettlementTab>('item');

const overviewLoading = ref(false);
const itemLoading = ref(false);
const applyLoading = ref(false);
const orderLoading = ref(false);
const submittingApply = ref(false);
const applyDetailVisible = ref(false);
const applyDetailLoading = ref(false);

const overview = ref<MerchantSettlementOverview>({
  pending_amount: '0.00',
  pending_count: 0,
  refund_amount: '0.00',
  settled_amount: '0.00',
  settled_count: 0,
});

const itemRows = ref<MerchantSettlementItem[]>([]);
const itemTotal = ref(0);
const itemPage = ref(1);
const itemPageSize = ref(20);
const selectedItemRows = ref<MerchantSettlementItem[]>([]);

const applyRows = ref<MerchantSettlementApplyItem[]>([]);
const applyTotal = ref(0);
const applyPage = ref(1);
const applyPageSize = ref(20);

const orderRows = ref<MerchantSettlementOrderItem[]>([]);
const orderTotal = ref(0);
const orderPage = ref(1);
const orderPageSize = ref(20);

const applyDetail = ref<MerchantSettlementApplyDetail | null>(null);

const itemFilters = reactive({
  biz_type: '',
  date_range: [] as string[],
  keyword: '',
  settlement_status: '',
});

const applyFilters = reactive({
  date_range: [] as string[],
  keyword: '',
  status: '',
});

const orderFilters = reactive({
  date_range: [] as string[],
  keyword: '',
  status: '',
});

const dateRangeShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = dayjs();
      return [today.startOf('day').toDate(), today.endOf('day').toDate()];
    },
  },
  {
    text: '近7天',
    value: () => {
      const today = dayjs();
      return [
        today.subtract(6, 'day').startOf('day').toDate(),
        today.endOf('day').toDate(),
      ];
    },
  },
  {
    text: '本月',
    value: () => {
      const today = dayjs();
      return [today.startOf('month').toDate(), today.endOf('month').toDate()];
    },
  },
];

const bizTypeOptions = [
  { label: '全部业务', value: '' },
  { label: '线路', value: 'line' },
  { label: '门票', value: 'ticket' },
  { label: '商品', value: 'goods' },
];

const settlementStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待结算', value: 'pending' },
  { label: '申请中', value: 'processing' },
  { label: '已结算', value: 'settled' },
  { label: '部分退款', value: 'part_refunded' },
  { label: '已退款', value: 'refunded' },
  { label: '已关闭', value: 'closed' },
];

const applyStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已打款', value: 'paid' },
  { label: '已关闭', value: 'closed' },
];

const orderStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待结算', value: 'pending' },
  { label: '已打款', value: 'settled' },
  { label: '已关闭', value: 'closed' },
];

const paymentModeMap: Record<string, string> = {
  direct: '直连商户',
  service_provider: '服务商模式',
};

const payTypeMap: Record<string, string> = {
  alipay: '支付宝',
  money: '余额支付',
  score: '积分支付',
  sys: '系统支付',
  wallet: '钱包支付',
  wechat: '微信支付',
};

const settleChannelMap: Record<string, string> = {
  internal: '内部结算',
  none: '无',
  wechat_profitsharing: '微信分账',
};

const summaryCards = computed(() => [
  {
    helper: '当前可发起申请的结算金额',
    icon: 'lucide:hourglass',
    iconClass: 'text-amber-500 bg-amber-500/10',
    title: '待结算金额',
    value: `${overview.value.pending_amount} 元`,
  },
  {
    helper: '已完成打款的结算金额',
    icon: 'lucide:badge-check',
    iconClass: 'text-emerald-500 bg-emerald-500/10',
    title: '已结算金额',
    value: `${overview.value.settled_amount} 元`,
  },
  {
    helper: '退款对结算产生的影响金额',
    icon: 'lucide:rotate-ccw',
    iconClass: 'text-rose-500 bg-rose-500/10',
    title: '退款影响金额',
    value: `${overview.value.refund_amount} 元`,
  },
  {
    helper: '待结算明细数 / 已打款结算单数',
    icon: 'lucide:file-stack',
    iconClass: 'text-cyan-500 bg-cyan-500/10',
    title: '结算进度',
    value: `${overview.value.pending_count} / ${overview.value.settled_count}`,
  },
]);

const activeTabTitle = computed(() => {
  switch (activeTab.value) {
    case 'apply': {
      return '结算申请';
    }
    case 'order': {
      return '结算单';
    }
    default: {
      return '结算明细';
    }
  }
});

const canSubmitApply = computed(() => {
  return selectedItemRows.value.some((item) => isApplyEligible(item));
});

const eligibleSelectedCount = computed(() => {
  return selectedItemRows.value.filter((item) => isApplyEligible(item)).length;
});

function formatDateTime(value?: number) {
  if (!value) {
    return '-';
  }

  return dayjs.unix(value).format('YYYY-MM-DD HH:mm');
}

function formatDateRange(start?: number, end?: number) {
  if (!start && !end) {
    return '-';
  }

  return `${formatDateTime(start)} 至 ${formatDateTime(end)}`;
}

function getDateParams(dateRange?: string[]) {
  return {
    date_from: Array.isArray(dateRange) ? dateRange[0] || undefined : undefined,
    date_to: Array.isArray(dateRange) ? dateRange[1] || undefined : undefined,
  };
}

function getSettlementStatusTagType(status?: string) {
  switch (status) {
    case 'closed':
    case 'refunded': {
      return 'info';
    }
    case 'part_refunded': {
      return 'danger';
    }
    case 'pending': {
      return 'warning';
    }
    case 'processing': {
      return 'primary';
    }
    case 'settled': {
      return 'success';
    }
    default: {
      return 'info';
    }
  }
}

function getApplyStatusTagType(status?: string) {
  switch (status) {
    case 'approved': {
      return 'primary';
    }
    case 'closed': {
      return 'info';
    }
    case 'paid': {
      return 'success';
    }
    case 'pending': {
      return 'warning';
    }
    case 'rejected': {
      return 'danger';
    }
    default: {
      return 'info';
    }
  }
}

function getOrderStatusTagType(status?: string) {
  switch (status) {
    case 'closed': {
      return 'info';
    }
    case 'pending': {
      return 'warning';
    }
    case 'settled': {
      return 'success';
    }
    default: {
      return 'info';
    }
  }
}

function getPaymentModeText(mode?: string) {
  if (!mode) {
    return '内部结算';
  }

  return paymentModeMap[mode] || mode;
}

function getPayTypeText(type?: string) {
  if (!type) {
    return '-';
  }

  return payTypeMap[type] || type;
}

function getSettleChannelText(channel?: string, text?: string) {
  if (text) {
    return text;
  }

  if (!channel) {
    return '-';
  }

  return settleChannelMap[channel] || channel;
}

function getVoucherPreviewList(url?: string) {
  return url ? [url] : [];
}

function isApplyEligible(item: MerchantSettlementItem) {
  return (
    item.settle_channel === 'internal' &&
    ['part_refunded', 'pending'].includes(item.settlement_status) &&
    Number(item.settlement_order_id || 0) === 0
  );
}

async function loadOverview() {
  overviewLoading.value = true;
  try {
    const response = await getSettlementOverviewApi();
    overview.value = response.overview;
  } catch (error) {
    console.error(error);
    ElMessage.error('结算总览加载失败，请稍后重试');
  } finally {
    overviewLoading.value = false;
  }
}

async function loadItemList() {
  itemLoading.value = true;
  try {
    const response = await getSettlementItemListApi({
      ...getDateParams(itemFilters.date_range),
      biz_type: itemFilters.biz_type || undefined,
      keyword: itemFilters.keyword || undefined,
      page: itemPage.value,
      page_size: itemPageSize.value,
      settlement_status: itemFilters.settlement_status || undefined,
    });

    itemRows.value = response.list || [];
    itemTotal.value = response.total || 0;
    selectedItemRows.value = [];
  } catch (error) {
    console.error(error);
    ElMessage.error('结算明细加载失败，请稍后重试');
    itemRows.value = [];
    itemTotal.value = 0;
    selectedItemRows.value = [];
  } finally {
    itemLoading.value = false;
  }
}

async function loadApplyList() {
  applyLoading.value = true;
  try {
    const response = await getSettlementApplyListApi({
      ...getDateParams(applyFilters.date_range),
      keyword: applyFilters.keyword || undefined,
      page: applyPage.value,
      page_size: applyPageSize.value,
      status: applyFilters.status || undefined,
    });

    applyRows.value = response.list || [];
    applyTotal.value = response.total || 0;
  } catch (error) {
    console.error(error);
    ElMessage.error('结算申请加载失败，请稍后重试');
    applyRows.value = [];
    applyTotal.value = 0;
  } finally {
    applyLoading.value = false;
  }
}

async function loadOrderList() {
  orderLoading.value = true;
  try {
    const response = await getSettlementOrderListApi({
      ...getDateParams(orderFilters.date_range),
      keyword: orderFilters.keyword || undefined,
      page: orderPage.value,
      page_size: orderPageSize.value,
      status: orderFilters.status || undefined,
    });

    orderRows.value = response.list || [];
    orderTotal.value = response.total || 0;
  } catch (error) {
    console.error(error);
    ElMessage.error('结算单加载失败，请稍后重试');
    orderRows.value = [];
    orderTotal.value = 0;
  } finally {
    orderLoading.value = false;
  }
}

async function refreshCurrentTab() {
  await loadOverview();

  if (activeTab.value === 'item') {
    await loadItemList();
    return;
  }

  if (activeTab.value === 'apply') {
    await loadApplyList();
    return;
  }

  await loadOrderList();
}

async function handleSubmitApply() {
  const eligibleRows = selectedItemRows.value.filter((item) =>
    isApplyEligible(item),
  );
  if (eligibleRows.length === 0) {
    ElMessage.warning('请先勾选可申请结算的内部结算明细');
    return;
  }

  let remark: string | undefined;

  try {
    const result = await ElMessageBox.prompt(
      `已选择 ${eligibleRows.length} 条内部结算明细，可填写申请备注后提交。`,
      '提交结算申请',
      {
        cancelButtonText: '取消',
        confirmButtonText: '提交申请',
        inputPlaceholder: '申请备注，选填',
      },
    );
    remark = result.value?.trim?.() || undefined;
  } catch {
    return;
  }

  submittingApply.value = true;
  try {
    const response = await createSettlementApplyApi({
      ids: eligibleRows.map((item) => item.id),
      remark,
    });

    ElMessage.success(`结算申请已提交：${response.apply.apply_no}`);
    itemPage.value = 1;
    applyPage.value = 1;
    await loadOverview();
    await loadItemList();
    await loadApplyList();
    activeTab.value = 'apply';
  } catch (error) {
    console.error(error);
  } finally {
    submittingApply.value = false;
  }
}

async function openApplyDetail(id: number) {
  applyDetailVisible.value = true;
  applyDetailLoading.value = true;

  try {
    const response = await getSettlementApplyDetailApi(id);
    applyDetail.value = response.detail;
  } catch (error) {
    console.error(error);
    applyDetail.value = null;
    ElMessage.error('结算申请详情加载失败，请稍后重试');
  } finally {
    applyDetailLoading.value = false;
  }
}

function resetItemFilters() {
  itemFilters.biz_type = '';
  itemFilters.date_range = [];
  itemFilters.keyword = '';
  itemFilters.settlement_status = '';
  itemPage.value = 1;
  loadItemList();
}

function resetApplyFilters() {
  applyFilters.date_range = [];
  applyFilters.keyword = '';
  applyFilters.status = '';
  applyPage.value = 1;
  loadApplyList();
}

function resetOrderFilters() {
  orderFilters.date_range = [];
  orderFilters.keyword = '';
  orderFilters.status = '';
  orderPage.value = 1;
  loadOrderList();
}

watch(
  () => activeTab.value,
  async (tab) => {
    if (tab === 'item' && itemRows.value.length === 0) {
      await loadItemList();
    }

    if (tab === 'apply' && applyRows.value.length === 0) {
      await loadApplyList();
    }

    if (tab === 'order' && orderRows.value.length === 0) {
      await loadOrderList();
    }
  },
);

onMounted(async () => {
  await loadOverview();
  await loadItemList();
});
</script>

<template>
  <Page
    auto-content-height
    content-class="flex flex-col gap-4"
    description="查看可结算明细、提交结算申请，并跟踪打款结算单状态。"
    title="结算中心"
  >
    <div class="settlement-hero rounded-3xl border px-6 py-6">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="space-y-3">
          <div
            class="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            <IconifyIcon icon="lucide:hand-coins" />
            结算中心
          </div>
          <div class="text-2xl font-semibold text-foreground">
            对齐订单回款、结算申请与打款跟踪
          </div>
          <div class="max-w-3xl text-sm leading-6 text-muted-foreground">
            当前区域为
            {{
              activeTabTitle
            }}。这套接口仅处理内部结算链路，适用于外部供应商的余额支付订单，不包含微信分账订单。
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElTag round size="large" type="warning">
            待结算 {{ overview.pending_count }} 条
          </ElTag>
          <ElTag round size="large" type="success">
            已结算 {{ overview.settled_count }} 单
          </ElTag>
          <ElButton @click="refreshCurrentTab">刷新数据</ElButton>
        </div>
      </div>
    </div>

    <div v-loading="overviewLoading" class="settlement-summary-grid">
      <div
        v-for="item in summaryCards"
        :key="item.title"
        class="settlement-summary-card rounded-3xl border p-5 shadow-sm"
      >
        <div class="settlement-summary-card__content">
          <div class="min-w-0">
            <div class="text-sm text-muted-foreground">{{ item.title }}</div>
            <div class="mt-3 text-3xl font-semibold text-foreground">
              {{ item.value }}
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{ item.helper }}
            </div>
          </div>
          <div :class="item.iconClass" class="settlement-summary-card__icon">
            <IconifyIcon :icon="item.icon" />
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border bg-card p-5 shadow-sm">
      <ElTabs v-model="activeTab">
        <ElTabPane label="结算明细" name="item">
          <div class="grid gap-4">
            <div class="settlement-filters rounded-2xl border p-4">
              <div class="settlement-filter-grid">
                <div class="settlement-field">
                  <div class="settlement-label">订单号</div>
                  <ElInput
                    v-model="itemFilters.keyword"
                    clearable
                    placeholder="请输入订单号"
                  />
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">业务类型</div>
                  <ElSelect v-model="itemFilters.biz_type">
                    <ElOption
                      v-for="item in bizTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">结算状态</div>
                  <ElSelect v-model="itemFilters.settlement_status">
                    <ElOption
                      v-for="item in settlementStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">完成时间</div>
                  <ElDatePicker
                    v-model="itemFilters.date_range"
                    class="w-full"
                    end-placeholder="结束日期"
                    range-separator="至"
                    :shortcuts="dateRangeShortcuts"
                    start-placeholder="开始日期"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div class="mt-4 flex flex-wrap justify-end gap-2">
                <ElButton @click="resetItemFilters">重置</ElButton>
                <ElButton
                  type="primary"
                  @click="
                    itemPage = 1;
                    loadItemList();
                  "
                >
                  查询
                </ElButton>
              </div>
            </div>

            <div class="settlement-table-panel rounded-2xl border p-4">
              <div class="settlement-table-panel__header mb-3">
                <div class="min-w-0">
                  <div class="text-base font-medium text-foreground">
                    待结算明细
                  </div>
                  <div class="mt-1 text-sm text-muted-foreground">
                    仅内部结算链路、待结算或部分退款、且尚未进入结算单的明细可以勾选提交。当前已选可申请
                    {{ eligibleSelectedCount }} 条。
                  </div>
                </div>
                <ElButton
                  class="shrink-0"
                  :disabled="!canSubmitApply"
                  :loading="submittingApply"
                  type="primary"
                  @click="handleSubmitApply"
                >
                  提交结算申请
                </ElButton>
              </div>

              <div v-loading="itemLoading" class="settlement-table-wrap">
                <ElTable
                  v-if="itemRows.length > 0"
                  :data="itemRows"
                  border
                  row-key="id"
                  style="width: 100%"
                  @selection-change="selectedItemRows = $event"
                >
                  <ElTableColumn
                    :selectable="(row) => isApplyEligible(row)"
                    type="selection"
                    width="48"
                  />
                  <ElTableColumn
                    label="订单号"
                    min-width="170"
                    prop="order_sn"
                  />
                  <ElTableColumn label="业务类型" min-width="100">
                    <template #default="{ row }">
                      <ElTag effect="plain" round>
                        {{ row.biz_type_text || row.biz_type || '-' }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="明细类型" min-width="120">
                    <template #default="{ row }">
                      {{ row.item_type_text || row.item_type || '-' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="支付方式" min-width="110">
                    <template #default="{ row }">
                      {{ getPayTypeText(row.pay_type) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="支付模式" min-width="120">
                    <template #default="{ row }">
                      {{ getPaymentModeText(row.payment_mode) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="结算通道" min-width="120">
                    <template #default="{ row }">
                      {{
                        getSettleChannelText(
                          row.settle_channel,
                          row.settle_channel_text,
                        )
                      }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn
                    label="实付金额"
                    min-width="110"
                    prop="pay_fee"
                  />
                  <ElTableColumn
                    label="退款金额"
                    min-width="110"
                    prop="refund_fee"
                  />
                  <ElTableColumn
                    label="原始结算"
                    min-width="110"
                    prop="settle_amount"
                  />
                  <ElTableColumn
                    label="当前待结"
                    min-width="110"
                    prop="current_settle_amount"
                  />
                  <ElTableColumn label="平台留存" min-width="110">
                    <template #default="{ row }">
                      {{ row.platform_amount || '-' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="结算状态" min-width="120">
                    <template #default="{ row }">
                      <ElTag
                        :type="
                          getSettlementStatusTagType(row.settlement_status)
                        "
                        effect="light"
                        round
                      >
                        {{ row.settlement_status_text || '-' }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="申请状态" min-width="110">
                    <template #default="{ row }">
                      <ElTag
                        :type="getApplyStatusTagType(row.apply_status)"
                        effect="light"
                        round
                      >
                        {{ row.apply_status_text || '-' }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="完成时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.completed_at) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="结算时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.settled_at) }}
                    </template>
                  </ElTableColumn>
                </ElTable>
                <ElEmpty
                  v-else
                  description="当前筛选条件下没有结算明细"
                  :image-size="90"
                />
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div class="text-sm text-muted-foreground">
                  共 {{ itemTotal }} 条记录
                </div>
                <ElPagination
                  v-model:current-page="itemPage"
                  v-model:page-size="itemPageSize"
                  background
                  layout="prev, pager, next, sizes"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="itemTotal"
                  @current-change="loadItemList"
                  @size-change="loadItemList"
                />
              </div>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="结算申请" name="apply">
          <div class="grid gap-4">
            <div class="settlement-filters rounded-2xl border p-4">
              <div class="settlement-filter-grid">
                <div class="settlement-field">
                  <div class="settlement-label">申请单号</div>
                  <ElInput
                    v-model="applyFilters.keyword"
                    clearable
                    placeholder="请输入申请单号"
                  />
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">申请状态</div>
                  <ElSelect v-model="applyFilters.status">
                    <ElOption
                      v-for="item in applyStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">申请时间</div>
                  <ElDatePicker
                    v-model="applyFilters.date_range"
                    class="w-full"
                    end-placeholder="结束日期"
                    range-separator="至"
                    :shortcuts="dateRangeShortcuts"
                    start-placeholder="开始日期"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div class="mt-4 flex flex-wrap justify-end gap-2">
                <ElButton @click="resetApplyFilters">重置</ElButton>
                <ElButton
                  type="primary"
                  @click="
                    applyPage = 1;
                    loadApplyList();
                  "
                >
                  查询
                </ElButton>
              </div>
            </div>

            <div class="settlement-table-panel rounded-2xl border p-4">
              <div v-loading="applyLoading" class="settlement-table-wrap">
                <ElTable v-if="applyRows.length > 0" :data="applyRows" border>
                  <ElTableColumn
                    label="申请单号"
                    min-width="190"
                    prop="apply_no"
                  />
                  <ElTableColumn
                    label="明细数"
                    min-width="90"
                    prop="order_count"
                  />
                  <ElTableColumn
                    label="申请金额"
                    min-width="110"
                    prop="apply_amount"
                  />
                  <ElTableColumn label="状态" min-width="110">
                    <template #default="{ row }">
                      <ElTag
                        :type="getApplyStatusTagType(row.status)"
                        effect="light"
                        round
                      >
                        {{ row.status_text || row.status || '-' }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="申请备注" min-width="160">
                    <template #default="{ row }">
                      {{ row.remark || '-' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="审核备注" min-width="160">
                    <template #default="{ row }">
                      {{ row.audit_remark || '-' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="申请时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.apply_time) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="审核时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.audit_time) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="打款时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.pay_time) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" min-width="100" fixed="right">
                    <template #default="{ row }">
                      <ElButton
                        link
                        type="primary"
                        @click="openApplyDetail(row.id)"
                      >
                        查看详情
                      </ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
                <ElEmpty
                  v-else
                  description="当前筛选条件下没有结算申请"
                  :image-size="90"
                />
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div class="text-sm text-muted-foreground">
                  共 {{ applyTotal }} 条记录
                </div>
                <ElPagination
                  v-model:current-page="applyPage"
                  v-model:page-size="applyPageSize"
                  background
                  layout="prev, pager, next, sizes"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="applyTotal"
                  @current-change="loadApplyList"
                  @size-change="loadApplyList"
                />
              </div>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="结算单" name="order">
          <div class="grid gap-4">
            <div class="settlement-filters rounded-2xl border p-4">
              <div class="settlement-filter-grid">
                <div class="settlement-field">
                  <div class="settlement-label">结算单号</div>
                  <ElInput
                    v-model="orderFilters.keyword"
                    clearable
                    placeholder="请输入结算单号"
                  />
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">结算单状态</div>
                  <ElSelect v-model="orderFilters.status">
                    <ElOption
                      v-for="item in orderStatusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </div>
                <div class="settlement-field">
                  <div class="settlement-label">创建时间</div>
                  <ElDatePicker
                    v-model="orderFilters.date_range"
                    class="w-full"
                    end-placeholder="结束日期"
                    range-separator="至"
                    :shortcuts="dateRangeShortcuts"
                    start-placeholder="开始日期"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                  />
                </div>
              </div>

              <div class="mt-4 flex flex-wrap justify-end gap-2">
                <ElButton @click="resetOrderFilters">重置</ElButton>
                <ElButton
                  type="primary"
                  @click="
                    orderPage = 1;
                    loadOrderList();
                  "
                >
                  查询
                </ElButton>
              </div>
            </div>

            <div class="settlement-table-panel rounded-2xl border p-4">
              <div v-loading="orderLoading" class="settlement-table-wrap">
                <ElTable v-if="orderRows.length > 0" :data="orderRows" border>
                  <ElTableColumn
                    label="结算单号"
                    min-width="190"
                    prop="settlement_no"
                  />
                  <ElTableColumn
                    label="明细数"
                    min-width="90"
                    prop="order_count"
                  />
                  <ElTableColumn
                    label="结算金额"
                    min-width="110"
                    prop="settle_amount"
                  />
                  <ElTableColumn
                    label="调整金额"
                    min-width="110"
                    prop="adjust_amount"
                  />
                  <ElTableColumn
                    label="最终金额"
                    min-width="110"
                    prop="final_amount"
                  />
                  <ElTableColumn label="状态" min-width="110">
                    <template #default="{ row }">
                      <ElTag
                        :type="getOrderStatusTagType(row.status)"
                        effect="light"
                        round
                      >
                        {{ row.status_text || row.status || '-' }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="结算周期" min-width="260">
                    <template #default="{ row }">
                      {{ formatDateRange(row.period_start, row.period_end) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="打款时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.pay_time) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="打款凭证" min-width="110">
                    <template #default="{ row }">
                      <div
                        v-if="row.pay_voucher"
                        class="flex items-center justify-center"
                      >
                        <ElImage
                          :preview-src-list="
                            getVoucherPreviewList(row.pay_voucher)
                          "
                          :src="row.pay_voucher"
                          fit="cover"
                          preview-teleported
                          class="settlement-voucher-thumb"
                        />
                      </div>
                      <span v-else>未上传</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="创建时间" min-width="160">
                    <template #default="{ row }">
                      {{ formatDateTime(row.createtime) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="备注" min-width="180">
                    <template #default="{ row }">
                      {{ row.remark || '-' }}
                    </template>
                  </ElTableColumn>
                </ElTable>
                <ElEmpty
                  v-else
                  description="当前筛选条件下没有结算单"
                  :image-size="90"
                />
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div class="text-sm text-muted-foreground">
                  共 {{ orderTotal }} 条记录
                </div>
                <ElPagination
                  v-model:current-page="orderPage"
                  v-model:page-size="orderPageSize"
                  background
                  layout="prev, pager, next, sizes"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="orderTotal"
                  @current-change="loadOrderList"
                  @size-change="loadOrderList"
                />
              </div>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <ElDialog v-model="applyDetailVisible" title="结算申请详情" width="960px">
      <div v-loading="applyDetailLoading" class="grid gap-4">
        <template v-if="applyDetail">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl border bg-muted/20 px-4 py-3">
              <div class="text-xs text-muted-foreground">申请单号</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.apply_no }}
              </div>
            </div>
            <div class="rounded-2xl border bg-muted/20 px-4 py-3">
              <div class="text-xs text-muted-foreground">申请金额</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.apply_amount }}
              </div>
            </div>
            <div class="rounded-2xl border bg-muted/20 px-4 py-3">
              <div class="text-xs text-muted-foreground">申请状态</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.status_text }}
              </div>
            </div>
            <div class="rounded-2xl border bg-muted/20 px-4 py-3">
              <div class="text-xs text-muted-foreground">明细数量</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.order_count }}
              </div>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-2xl border bg-muted/10 px-4 py-3">
              <div class="text-xs text-muted-foreground">申请备注</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.remark || '-' }}
              </div>
            </div>
            <div class="rounded-2xl border bg-muted/10 px-4 py-3">
              <div class="text-xs text-muted-foreground">审核备注</div>
              <div class="mt-1.5 text-sm font-medium">
                {{ applyDetail.audit_remark || '-' }}
              </div>
            </div>
          </div>

          <div class="rounded-2xl border p-4">
            <div class="mb-3 text-sm font-medium text-foreground">申请明细</div>
            <ElTable :data="applyDetail.items" border>
              <ElTableColumn label="明细 ID" min-width="90" prop="id" />
              <ElTableColumn
                label="业务类型"
                min-width="100"
                prop="biz_type_text"
              />
              <ElTableColumn label="订单号" min-width="170" prop="order_sn" />
              <ElTableColumn
                label="原始结算"
                min-width="110"
                prop="settle_amount"
              />
              <ElTableColumn
                label="当前待结"
                min-width="110"
                prop="current_settle_amount"
              />
              <ElTableColumn label="结算状态" min-width="120">
                <template #default="{ row }">
                  <ElTag
                    :type="getSettlementStatusTagType(row.settlement_status)"
                    effect="light"
                    round
                  >
                    {{ row.settlement_status_text || '-' }}
                  </ElTag>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </template>
        <ElEmpty
          v-else-if="!applyDetailLoading"
          description="暂无可展示的结算申请详情"
          :image-size="90"
        />
      </div>
    </ElDialog>
  </Page>
</template>

<style scoped>
.settlement-hero {
  background:
    radial-gradient(
      circle at top right,
      rgb(16 185 129 / 10%),
      transparent 28%
    ),
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)));
}

.settlement-summary-card {
  background:
    radial-gradient(circle at top right, rgb(64 158 255 / 8%), transparent 28%),
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)));
}

.settlement-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 16px;
  min-width: 0;
}

.settlement-summary-card__content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.settlement-summary-card__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  border-radius: 14px;
}

.settlement-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 16px;
  min-width: 0;
  max-width: 100%;
}

.settlement-filters,
.settlement-table-panel {
  min-width: 0;
  max-width: 100%;
}

.settlement-field {
  min-width: 0;
}

.settlement-field :deep(.el-input),
.settlement-field :deep(.el-select),
.settlement-field :deep(.el-date-editor) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.settlement-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.settlement-table-panel__header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.settlement-table-wrap {
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.settlement-table-wrap :deep(.el-table) {
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.settlement-table-wrap :deep(.el-table__inner-wrapper),
.settlement-table-wrap :deep(.el-table__body-wrapper),
.settlement-table-wrap :deep(.el-scrollbar),
.settlement-table-wrap :deep(.el-scrollbar__wrap) {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto !important;
}

.settlement-table-wrap :deep(.el-table__fixed-right),
.settlement-table-wrap :deep(.el-table__fixed-right-patch) {
  right: 0 !important;
}

.settlement-table-wrap :deep(.el-scrollbar__bar.is-horizontal) {
  display: block !important;
}

.settlement-voucher-thumb {
  width: 44px;
  height: 44px;
  overflow: hidden;
  cursor: pointer;
  background: hsl(var(--muted) / 40%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

@media (max-width: 768px) {
  .settlement-table-panel__header :deep(.el-button) {
    width: 100%;
  }
}
</style>
