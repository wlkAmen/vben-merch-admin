<script lang="ts" setup>
import type {
  MerchantBillFlowItem,
  MerchantBillMetaResult,
  MerchantBillStatementItem,
  MerchantBillSummary,
} from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import {
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElInput,
  ElMessage,
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
  exportBillApi,
  getBillListApi,
  getBillOptionsApi,
  getBillStatementListApi,
  getBillSummaryApi,
} from '#/api';

import { getProcessStatusTagType } from '../order/helper';
import GoodsOrderDetailModal from '../order/modules/goods-order-detail-modal.vue';
import LineOrderDetailModal from '../order/modules/line-order-detail-modal.vue';
import OrderUserPopover from '../order/modules/order-user-popover.vue';
import RefundOrderDetailModal from '../order/modules/refund-order-detail-modal.vue';
import TicketOrderDetailModal from '../order/modules/ticket-order-detail-modal.vue';
import BillStatementDetailModal from './modules/bill-statement-detail-modal.vue';

defineOptions({ name: 'MerchantFinanceBillPage' });

interface BillFlowRow extends MerchantBillFlowItem {
  __row_key: string;
}

const activeTab = ref<'flow' | 'statement'>('flow');
const metaRef = ref<MerchantBillMetaResult | null>(null);
const summaryLoading = ref(false);
const flowLoading = ref(false);
const statementLoading = ref(false);
const exporting = ref(false);

const flowRows = ref<BillFlowRow[]>([]);
const flowTotal = ref(0);
const flowCurrentPage = ref(1);
const flowPageSize = ref(20);

const statementRows = ref<MerchantBillStatementItem[]>([]);

const summary = ref<MerchantBillSummary>({
  finished_amount: '0.00',
  net_amount: '0.00',
  order_count: 0,
  paid_amount: '0.00',
  refund_amount: '0.00',
  refund_count: 0,
});

const filters = reactive({
  biz_type: '',
  date_range: [] as string[],
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
      const end = dayjs();
      return [
        end.subtract(6, 'day').startOf('day').toDate(),
        end.endOf('day').toDate(),
      ];
    },
  },
  {
    text: '本周',
    value: () => {
      const today = dayjs();
      return [today.startOf('week').toDate(), today.endOf('week').toDate()];
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

const flowFilters = reactive({
  flow_type: '',
  keyword: '',
  order_status: '',
  pay_type: '',
  platform: '',
  refund_status: '',
});

const statementFilters = reactive({
  cycle_type: 'day',
});

const flowPageSizeOptions = [10, 20, 50, 100];

const summaryCardIcons = [
  { icon: 'lucide:wallet', iconClass: 'text-blue-500 bg-blue-500/10' },
  { icon: 'lucide:rotate-ccw', iconClass: 'text-rose-500 bg-rose-500/10' },
  {
    icon: 'lucide:chart-no-axes-column-increasing',
    iconClass: 'text-emerald-500 bg-emerald-500/10',
  },
  { icon: 'lucide:badge-check', iconClass: 'text-cyan-500 bg-cyan-500/10' },
  { icon: 'lucide:receipt-text', iconClass: 'text-amber-500 bg-amber-500/10' },
  {
    icon: 'lucide:file-minus-2',
    iconClass: 'text-violet-500 bg-violet-500/10',
  },
];

const summaryCards = computed(() => [
  {
    helper: '按支付时间统计',
    title: '成交金额',
    value: summary.value.paid_amount || '0.00',
  },
  {
    helper: '按退款完成时间统计',
    title: '退款金额',
    value: summary.value.refund_amount || '0.00',
  },
  {
    helper: '成交金额减退款金额',
    title: '净收入',
    value: summary.value.net_amount || '0.00',
  },
  {
    helper: '按订单完成时间统计',
    title: '完单金额',
    value: summary.value.finished_amount || '0.00',
  },
  {
    helper: '已支付订单数',
    title: '订单数',
    value: String(summary.value.order_count ?? 0),
  },
  {
    helper: '已完成退款单数',
    title: '退款单数',
    value: String(summary.value.refund_count ?? 0),
  },
]);

const activeTabTitle = computed(() => {
  return activeTab.value === 'flow' ? '账单流水' : '周期对账';
});

const activeTabHelperText = computed(() => {
  if (activeTab.value === 'flow') {
    return '当前查看账单流水，会带上当前日期范围、业务类型和明细筛选条件。';
  }

  return '当前查看周期对账汇总，会带上当前日期范围、业务类型和周期类型。';
});

const exportButtonText = computed(() => {
  return activeTab.value === 'flow' ? '导出账单流水' : '导出周期对账';
});

const statementHelperText = computed(() => {
  return statementFilters.cycle_type === 'month'
    ? '当前按月汇总，可查看单月对账明细或导出月度汇总。'
    : '当前按日汇总，可查看单日对账明细或导出每日汇总。';
});

function getBizTypeTagType(type?: string) {
  switch (type) {
    case 'goods': {
      return 'success';
    }
    case 'line': {
      return 'primary';
    }
    case 'ticket': {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
}

function getFlowTypeTagType(type?: string) {
  return type === 'refund' ? 'danger' : 'success';
}

function getTopParams() {
  const dateRange = filters.date_range || [];
  return {
    biz_type: filters.biz_type || undefined,
    date_from: Array.isArray(dateRange) ? dateRange[0] : undefined,
    date_to: Array.isArray(dateRange) ? dateRange[1] : undefined,
  };
}

function getOrderStatusOptions(bizType?: string) {
  const options = metaRef.value?.order_status_options || [];
  const rows = bizType
    ? options.filter((item) => item.biz_type === bizType)
    : options;
  const result: typeof rows = [];

  for (const item of rows) {
    if (!result.some((current) => current.value === item.value)) {
      result.push(item);
    }
  }

  return result;
}

function normalizeFlowRows(items: MerchantBillFlowItem[]) {
  return items.map(
    (item, index): BillFlowRow => ({
      ...item,
      __row_key: [
        item.biz_type || 'unknown',
        item.flow_type || 'unknown',
        item.id,
        item.order_id || 0,
        item.refund_id || 0,
        item.occur_time || 0,
        index,
      ].join('_'),
    }),
  );
}

async function loadMeta() {
  metaRef.value = await getBillOptionsApi();
  if (!statementFilters.cycle_type) {
    statementFilters.cycle_type =
      metaRef.value.cycle_type_options?.[0]?.value || 'day';
  }
}

async function loadSummary() {
  summaryLoading.value = true;
  try {
    const response = await getBillSummaryApi(getTopParams());
    summary.value = response.summary;
  } catch (error) {
    console.error(error);
    ElMessage.error('账单汇总加载失败，请稍后重试');
  } finally {
    summaryLoading.value = false;
  }
}

async function loadFlowList() {
  flowLoading.value = true;
  try {
    const response = await getBillListApi({
      ...getTopParams(),
      flow_type: flowFilters.flow_type || undefined,
      keyword: flowFilters.keyword || undefined,
      order_status: flowFilters.order_status || undefined,
      page: flowCurrentPage.value,
      page_size: flowPageSize.value,
      pay_type: flowFilters.pay_type || undefined,
      platform: flowFilters.platform || undefined,
      refund_status: flowFilters.refund_status || undefined,
    });

    flowRows.value = normalizeFlowRows(response.list || []);
    flowTotal.value = response.total || 0;
  } catch (error) {
    console.error(error);
    ElMessage.error('账单流水加载失败，请稍后重试');
    flowRows.value = [];
    flowTotal.value = 0;
  } finally {
    flowLoading.value = false;
  }
}

async function loadStatementList() {
  statementLoading.value = true;
  try {
    statementRows.value = await getBillStatementListApi({
      ...getTopParams(),
      cycle_type: statementFilters.cycle_type,
    });
  } catch (error) {
    console.error(error);
    ElMessage.error('周期对账加载失败，请稍后重试');
  } finally {
    statementLoading.value = false;
  }
}

async function refreshCurrentTab() {
  await loadSummary();
  await (activeTab.value === 'flow' ? loadFlowList() : loadStatementList());
}

async function applyTopFilters() {
  flowCurrentPage.value = 1;
  await refreshCurrentTab();
}

function resetAllFilters() {
  filters.biz_type = '';
  filters.date_range = [];
  flowFilters.flow_type = '';
  flowFilters.keyword = '';
  flowFilters.order_status = '';
  flowFilters.pay_type = '';
  flowFilters.platform = '';
  flowFilters.refund_status = '';
  flowCurrentPage.value = 1;
  refreshCurrentTab();
}

async function searchFlowList() {
  flowCurrentPage.value = 1;
  await loadFlowList();
}

async function handleExport() {
  exporting.value = true;
  try {
    const params =
      activeTab.value === 'flow'
        ? {
            ...getTopParams(),
            flow_type: flowFilters.flow_type || undefined,
            keyword: flowFilters.keyword || undefined,
            order_status: flowFilters.order_status || undefined,
            pay_type: flowFilters.pay_type || undefined,
            platform: flowFilters.platform || undefined,
            refund_status: flowFilters.refund_status || undefined,
            export_type: 'flow' as const,
          }
        : {
            ...getTopParams(),
            cycle_type: statementFilters.cycle_type,
            export_type: 'statement' as const,
          };

    const response = await exportBillApi(params);
    if (response.download_url) {
      window.open(response.download_url, '_blank');
    }
    ElMessage.success(
      `${activeTab.value === 'flow' ? '账单流水' : '周期对账'}导出成功，共 ${response.record_count} 条记录`,
    );
  } catch (error) {
    console.error(error);
  } finally {
    exporting.value = false;
  }
}

const [LineDetailModal, lineDetailModalApi] = useVbenModal({
  connectedComponent: LineOrderDetailModal,
  destroyOnClose: true,
});
const [TicketDetailModal, ticketDetailModalApi] = useVbenModal({
  connectedComponent: TicketOrderDetailModal,
  destroyOnClose: true,
});
const [GoodsDetailModal, goodsDetailModalApi] = useVbenModal({
  connectedComponent: GoodsOrderDetailModal,
  destroyOnClose: true,
});
const [RefundDetailModal, refundDetailModalApi] = useVbenModal({
  connectedComponent: RefundOrderDetailModal,
  destroyOnClose: true,
});
const [StatementDetailModal, statementDetailModalApi] = useVbenModal({
  connectedComponent: BillStatementDetailModal,
  destroyOnClose: true,
});

function openFlowDetail(row: BillFlowRow) {
  if (row.flow_type === 'refund' && row.refund_id) {
    refundDetailModalApi.setData({ id: row.refund_id }).open();
    return;
  }

  switch (row.biz_type) {
    case 'goods': {
      goodsDetailModalApi.setData({ id: row.order_id }).open();
      break;
    }
    case 'line': {
      lineDetailModalApi.setData({ id: row.order_id }).open();
      break;
    }
    case 'ticket': {
      ticketDetailModalApi.setData({ id: row.order_id }).open();
      break;
    }
    default: {
      break;
    }
  }
}

function openStatementDetail(row: MerchantBillStatementItem) {
  statementDetailModalApi
    .setData({
      bizType: filters.biz_type || undefined,
      cycleKey: row.cycle_key,
      cycleText: row.cycle_text,
      cycleType: statementFilters.cycle_type,
    })
    .open();
}

watch(
  () => activeTab.value,
  async () => {
    if (activeTab.value === 'statement' && statementRows.value.length === 0) {
      await loadStatementList();
    }
  },
);

watch(
  () => statementFilters.cycle_type,
  async () => {
    if (activeTab.value === 'statement') {
      await loadStatementList();
    }
  },
);

onMounted(async () => {
  await loadMeta();
  await refreshCurrentTab();
});
</script>

<template>
  <Page
    auto-content-height
    class="finance-bill-page"
    description="查看商家成交、退款与净收入，支持流水查询、周期对账与导出。"
    title="账单查询"
  >
    <template #extra>
      <div class="flex flex-wrap gap-2">
        <ElButton @click="resetAllFilters">重置筛选</ElButton>
        <ElButton type="primary" @click="refreshCurrentTab">刷新数据</ElButton>
        <ElButton :loading="exporting" type="success" @click="handleExport">
          {{ exportButtonText }}
        </ElButton>
      </div>
    </template>

    <LineDetailModal />
    <TicketDetailModal />
    <GoodsDetailModal />
    <RefundDetailModal />
    <StatementDetailModal />

    <div class="grid min-w-0 gap-4">
      <div class="finance-panel rounded-3xl border bg-card p-5 shadow-sm">
        <div class="finance-top-filter">
          <div class="finance-top-filter__header">
            <div class="finance-top-filter__intro">
              <div class="finance-top-filter__heading">
                <div class="finance-top-filter__title">查询范围</div>
              </div>
              <div class="finance-top-filter__desc">
                先确认对账时间范围和业务类型，再查看当前区域的汇总数据与明细。
              </div>
            </div>

            <div class="finance-top-filter__status-wrap">
              <span class="finance-top-filter__status-label">当前区域</span>
              <div
                class="finance-top-filter__status finance-top-filter__status--inline"
              >
                {{ activeTabTitle }}
              </div>
            </div>
          </div>

          <div class="finance-top-filter__body">
            <div class="finance-top-filter__field">
              <div class="finance-top-filter__label">日期范围</div>
              <ElDatePicker
                v-model="filters.date_range"
                class="w-full"
                end-placeholder="结束日期"
                range-separator="至"
                :shortcuts="dateRangeShortcuts"
                start-placeholder="开始日期"
                type="daterange"
                value-format="YYYY-MM-DD"
              />
            </div>

            <div class="finance-top-filter__field">
              <div class="finance-top-filter__label">业务类型</div>
              <ElSelect
                v-model="filters.biz_type"
                class="w-full"
                clearable
                placeholder="全部业务类型"
              >
                <ElOption
                  v-for="item in metaRef?.biz_type_options || []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </div>

            <div class="finance-top-filter__actions">
              <ElButton type="primary" @click="applyTopFilters">
                查询数据
              </ElButton>
            </div>
          </div>

          <div class="finance-top-filter__helper">
            {{ activeTabHelperText }}
          </div>
        </div>
      </div>

      <div
        v-loading="summaryLoading"
        class="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="(item, index) in summaryCards"
          :key="item.title"
          class="finance-summary-card rounded-3xl border p-5 shadow-sm"
        >
          <div class="finance-summary-card__content">
            <div class="min-w-0">
              <div class="text-sm text-muted-foreground">{{ item.title }}</div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ item.value }}
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ item.helper }}
              </div>
            </div>

            <div
              :class="summaryCardIcons[index]?.iconClass"
              class="finance-summary-card__icon"
            >
              <IconifyIcon
                :icon="summaryCardIcons[index]?.icon || 'lucide:circle-help'"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="finance-panel rounded-3xl border bg-card p-5 shadow-sm">
        <ElTabs v-model="activeTab">
          <ElTabPane label="流水明细" name="flow">
            <div class="finance-flow-section">
              <div class="finance-flow-filters rounded-2xl border p-4">
                <div class="finance-flow-grid">
                  <div class="finance-flow-field">
                    <div class="finance-flow-label">关键词</div>
                    <ElInput
                      v-model="flowFilters.keyword"
                      class="w-full"
                      clearable
                      placeholder="订单号、退款单号、用户、联系人、收货人"
                    />
                  </div>

                  <div class="finance-flow-field">
                    <div class="finance-flow-label">流水类型</div>
                    <ElSelect
                      v-model="flowFilters.flow_type"
                      class="w-full"
                      clearable
                      placeholder="请选择"
                    >
                      <ElOption
                        v-for="item in metaRef?.flow_type_options || []"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </div>

                  <div class="finance-flow-field">
                    <div class="finance-flow-label">支付方式</div>
                    <ElSelect
                      v-model="flowFilters.pay_type"
                      class="w-full"
                      clearable
                      placeholder="请选择"
                    >
                      <ElOption
                        v-for="item in metaRef?.pay_type_options || []"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </div>

                  <div class="finance-flow-field">
                    <div class="finance-flow-label">平台来源</div>
                    <ElSelect
                      v-model="flowFilters.platform"
                      class="w-full"
                      clearable
                      placeholder="请选择"
                    >
                      <ElOption
                        v-for="item in metaRef?.platform_options || []"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </div>

                  <div class="finance-flow-field">
                    <div class="finance-flow-label">订单状态</div>
                    <ElSelect
                      v-model="flowFilters.order_status"
                      class="w-full"
                      clearable
                      placeholder="请选择"
                    >
                      <ElOption
                        v-for="item in getOrderStatusOptions(filters.biz_type)"
                        :key="`${item.biz_type}-${item.value}`"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </div>

                  <div class="finance-flow-field">
                    <div class="finance-flow-label">退款状态</div>
                    <ElSelect
                      v-model="flowFilters.refund_status"
                      class="w-full"
                      clearable
                      placeholder="请选择"
                    >
                      <ElOption
                        v-for="item in metaRef?.refund_status_options || []"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </div>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                  <ElButton
                    @click="
                      flowFilters.flow_type = '';
                      flowFilters.keyword = '';
                      flowFilters.order_status = '';
                      flowFilters.pay_type = '';
                      flowFilters.platform = '';
                      flowFilters.refund_status = '';
                      searchFlowList();
                    "
                  >
                    重置
                  </ElButton>
                  <ElButton type="primary" @click="searchFlowList">
                    查询
                  </ElButton>
                </div>
              </div>

              <div class="finance-flow-table-panel rounded-2xl border p-4">
                <div
                  class="mb-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div class="text-base font-medium">账单流水</div>
                  <div class="text-sm text-muted-foreground">
                    收入与退款统一折算为账单流水，可直接点详情查看原订单或退款单，并支持导出当前筛选结果。
                  </div>
                </div>

                <div v-loading="flowLoading" class="finance-flow-table-wrap">
                  <ElTable
                    v-if="flowRows.length > 0"
                    :data="flowRows"
                    border
                    row-key="__row_key"
                    style="width: 100%"
                  >
                    <ElTableColumn
                      label="业务时间"
                      min-width="170"
                      prop="occur_time_text"
                    />
                    <ElTableColumn label="流水类型" min-width="100">
                      <template #default="{ row }">
                        <ElTag
                          :type="getFlowTypeTagType(row.flow_type)"
                          effect="light"
                          round
                        >
                          {{ row.flow_type_text || row.flow_type || '-' }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="业务类型" min-width="100">
                      <template #default="{ row }">
                        <ElTag
                          :type="getBizTypeTagType(row.biz_type)"
                          effect="plain"
                          round
                        >
                          {{ row.biz_type_text || row.biz_type || '-' }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="下单用户" min-width="180">
                      <template #default="{ row }">
                        <OrderUserPopover :user-info="row.user_info" />
                      </template>
                    </ElTableColumn>
                    <ElTableColumn
                      label="联系人/收货人"
                      min-width="130"
                      prop="contact_name"
                    />
                    <ElTableColumn
                      label="联系电话"
                      min-width="140"
                      prop="contact_mobile"
                    />
                    <ElTableColumn label="资源信息" min-width="220">
                      <template #default="{ row }">
                        <div class="min-w-0 space-y-1 text-left">
                          <div class="truncate font-medium text-foreground">
                            {{ row.resource_title || '-' }}
                          </div>
                          <div class="truncate text-xs text-muted-foreground">
                            {{ row.resource_subtitle || '-' }}
                          </div>
                        </div>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn
                      label="支付方式"
                      min-width="110"
                      prop="pay_type_text"
                    />
                    <ElTableColumn
                      label="平台来源"
                      min-width="120"
                      prop="platform_text"
                    />
                    <ElTableColumn
                      label="订单号"
                      min-width="170"
                      prop="order_sn"
                    />
                    <ElTableColumn
                      label="退款单号"
                      min-width="170"
                      prop="refund_sn"
                    />
                    <ElTableColumn
                      label="收入金额"
                      min-width="100"
                      prop="income_amount"
                    />
                    <ElTableColumn
                      label="退款金额"
                      min-width="100"
                      prop="refund_amount"
                    />
                    <ElTableColumn
                      label="净额"
                      min-width="100"
                      prop="net_amount"
                    />
                    <ElTableColumn label="订单状态" min-width="110">
                      <template #default="{ row }">
                        <ElTag
                          :type="
                            getProcessStatusTagType(
                              row.order_status,
                              row.order_status_text,
                            )
                          "
                          effect="light"
                          round
                        >
                          {{ row.order_status_text || row.order_status || '-' }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="退款状态" min-width="110">
                      <template #default="{ row }">
                        <ElTag
                          :type="
                            getProcessStatusTagType(
                              row.refund_status,
                              row.refund_status_text,
                            )
                          "
                          effect="light"
                          round
                        >
                          {{
                            row.refund_status_text || row.refund_status || '-'
                          }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="备注" min-width="180" prop="remark" />
                    <ElTableColumn label="操作" min-width="100" fixed="right">
                      <template #default="{ row }">
                        <ElButton
                          link
                          type="primary"
                          @click="openFlowDetail(row)"
                        >
                          详情
                        </ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>

                  <ElEmpty
                    v-else
                    description="当前筛选条件下没有账单流水数据"
                    :image-size="90"
                  />
                </div>

                <div
                  class="mt-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div class="text-sm text-muted-foreground">
                    共 {{ flowTotal }} 条记录
                  </div>
                  <ElPagination
                    v-model:current-page="flowCurrentPage"
                    v-model:page-size="flowPageSize"
                    background
                    layout="prev, pager, next, sizes"
                    :page-sizes="flowPageSizeOptions"
                    :total="flowTotal"
                    @current-change="loadFlowList"
                    @size-change="searchFlowList"
                  />
                </div>
              </div>
            </div>
          </ElTabPane>

          <ElTabPane label="周期对账" name="statement">
            <div class="mb-4 flex flex-wrap items-center gap-3">
              <ElSelect
                v-model="statementFilters.cycle_type"
                class="w-[220px]"
                placeholder="请选择周期类型"
              >
                <ElOption
                  v-for="item in metaRef?.cycle_type_options || []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
              <div class="text-sm text-muted-foreground">
                周期对账会按当前日期范围和业务类型聚合。{{
                  statementHelperText
                }}
              </div>
            </div>

            <div v-loading="statementLoading" class="finance-table-wrap">
              <ElTable
                v-if="statementRows.length > 0"
                :data="statementRows"
                border
                class="finance-statement-table"
              >
                <ElTableColumn label="周期" min-width="140" prop="cycle_text" />
                <ElTableColumn
                  label="线路成交"
                  min-width="110"
                  prop="line_paid_amount"
                />
                <ElTableColumn
                  label="门票成交"
                  min-width="110"
                  prop="ticket_paid_amount"
                />
                <ElTableColumn
                  label="商品成交"
                  min-width="110"
                  prop="goods_paid_amount"
                />
                <ElTableColumn
                  label="总成交"
                  min-width="110"
                  prop="paid_amount"
                />
                <ElTableColumn
                  label="总退款"
                  min-width="110"
                  prop="refund_amount"
                />
                <ElTableColumn
                  label="净收入"
                  min-width="110"
                  prop="net_amount"
                />
                <ElTableColumn
                  label="完单金额"
                  min-width="110"
                  prop="finished_amount"
                />
                <ElTableColumn
                  label="订单数"
                  min-width="90"
                  prop="order_count"
                />
                <ElTableColumn
                  label="退款单数"
                  min-width="90"
                  prop="refund_count"
                />
                <ElTableColumn label="操作" min-width="110" fixed="right">
                  <template #default="{ row }">
                    <ElButton
                      link
                      type="primary"
                      @click="openStatementDetail(row)"
                    >
                      查看明细
                    </ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>

              <ElEmpty
                v-else
                description="当前筛选条件下没有周期对账数据"
                :image-size="90"
              />
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.finance-bill-page {
  overflow-x: hidden;
}

.finance-panel {
  min-width: 0;
  overflow: hidden;
}

.finance-top-filter__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.finance-top-filter__intro {
  min-width: 0;
}

.finance-top-filter__heading {
  display: flex;
  align-items: center;
}

.finance-top-filter__title {
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.finance-top-filter__status {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 25%);
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
}

.finance-top-filter__desc {
  max-width: 720px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: hsl(var(--muted-foreground));
}

.finance-top-filter__body {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(220px, 280px) auto;
  gap: 16px;
  align-items: end;
  justify-content: start;
  margin-top: 4px;
}

.finance-top-filter__field {
  min-width: 0;
  max-width: 100%;
}

.finance-top-filter__actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
}

.finance-top-filter__label {
  margin-bottom: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.finance-top-filter__status-wrap {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  padding-top: 2px;
}

.finance-top-filter__status--inline {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 12px;
}

.finance-top-filter__status-label {
  font-size: 13px;
  line-height: 1;
  color: hsl(var(--muted-foreground));
}

.finance-top-filter__helper {
  padding-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: hsl(var(--muted-foreground) / 92%);
}

.finance-flow-section {
  display: grid;
  gap: 16px;
}

.finance-flow-filters,
.finance-flow-table-panel {
  min-width: 0;
}

.finance-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 16px;
  min-width: 0;
  max-width: 100%;
}

.finance-flow-field {
  min-width: 0;
  max-width: 100%;
}

.finance-flow-field :deep(.el-input),
.finance-flow-field :deep(.el-select) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.finance-flow-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.finance-flow-table-wrap {
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.finance-flow-table-wrap :deep(.el-table) {
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.finance-flow-table-wrap :deep(.el-table__inner-wrapper),
.finance-flow-table-wrap :deep(.el-table__body-wrapper),
.finance-flow-table-wrap :deep(.el-scrollbar),
.finance-flow-table-wrap :deep(.el-scrollbar__wrap) {
  min-width: 0;
  max-width: 100%;
}

.finance-flow-table-wrap :deep(.el-table__fixed-right),
.finance-flow-table-wrap :deep(.el-table__fixed-right-patch) {
  right: 0 !important;
}

.finance-flow-table-wrap :deep(.el-scrollbar__bar.is-horizontal) {
  display: block !important;
}

.finance-table-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.finance-statement-table {
  width: 100%;
}

.finance-table-wrap :deep(.el-table) {
  width: 100%;
}

.finance-table-wrap :deep(.el-table__inner-wrapper) {
  overflow: hidden;
}

.finance-table-wrap :deep(.el-table__body-wrapper),
.finance-table-wrap :deep(.el-scrollbar__wrap) {
  overflow-x: auto !important;
}

.finance-table-wrap :deep(.el-scrollbar__bar.is-horizontal) {
  display: block !important;
}

.finance-table-wrap :deep(.el-table__fixed-right),
.finance-table-wrap :deep(.el-table__fixed-right-patch) {
  right: 0 !important;
}

.finance-summary-card {
  background:
    radial-gradient(circle at top right, rgb(64 158 255 / 8%), transparent 28%),
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)));
}

.finance-summary-card__content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.finance-summary-card__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  border-radius: 14px;
}

@media (max-width: 1024px) {
  .finance-top-filter__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .finance-top-filter__body {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px) auto;
  }
}

@media (max-width: 768px) {
  .finance-top-filter__actions {
    justify-content: stretch;
  }

  .finance-top-filter__actions :deep(.el-button) {
    width: 100%;
  }

  .finance-top-filter__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
