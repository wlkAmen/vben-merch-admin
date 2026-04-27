<script lang="ts" setup>
import type {
  MerchantBillFlowItem,
  MerchantBillMetaResult,
} from '#/api';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  getBillOptionsApi,
  getBillStatementDetailApi,
} from '#/api';

import { getProcessStatusTagType } from '../../order/helper';
import OrderUserPopover from '../../order/modules/order-user-popover.vue';

defineOptions({ name: 'MerchantBillStatementDetailModal' });

interface BillStatementDetailRow extends MerchantBillFlowItem {
  __row_key: string;
}

const detailLoading = ref(false);
const metaRef = ref<MerchantBillMetaResult | null>(null);
const rows = ref<BillStatementDetailRow[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

const filters = reactive({
  flow_type: '',
  keyword: '',
  order_status: '',
  pay_type: '',
  platform: '',
  refund_status: '',
});

const cycleInfo = computed(() => {
  return modalApi.getData<{
    bizType?: string;
    cycleKey: string;
    cycleText: string;
    cycleType: string;
  }>();
});

const pageSizeOptions = [10, 20, 50, 100];

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

function normalizeRows(items: MerchantBillFlowItem[]) {
  return items.map((item, index): BillStatementDetailRow => ({
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
  }));
}

async function loadMeta(_bizType?: string) {
  metaRef.value = await getBillOptionsApi();
}

async function loadDetail() {
  detailLoading.value = true;

  try {
    const response = await getBillStatementDetailApi({
      biz_type: cycleInfo.value?.bizType,
      cycle_key: cycleInfo.value.cycleKey,
      cycle_type: cycleInfo.value.cycleType,
      flow_type: filters.flow_type || undefined,
      keyword: filters.keyword || undefined,
      order_status: filters.order_status || undefined,
      page: currentPage.value,
      page_size: pageSize.value,
      pay_type: filters.pay_type || undefined,
      platform: filters.platform || undefined,
      refund_status: filters.refund_status || undefined,
    });

    rows.value = normalizeRows(response.list || []);
    total.value = response.total || 0;
  } catch (error) {
    console.error(error);
    rows.value = [];
    total.value = 0;
  } finally {
    detailLoading.value = false;
  }
}

async function reloadFromFirstPage() {
  currentPage.value = 1;
  await loadDetail();
}

function resetFilters() {
  filters.flow_type = '';
  filters.keyword = '';
  filters.order_status = '';
  filters.pay_type = '';
  filters.platform = '';
  filters.refund_status = '';
  reloadFromFirstPage();
}

const [Modal, modalApi] = useVbenModal({
  contentClass: 'overflow-x-hidden',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    modalApi.close();
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }

    currentPage.value = 1;
    pageSize.value = 20;
    resetFilters();

    const data = cycleInfo.value;
    modalApi.setState({
      confirmText: '关闭',
      loading: true,
      showCancelButton: false,
      title: `${data.cycleText} 对账明细`,
    });

    try {
      await loadMeta(data.bizType);
      await loadDetail();
    } finally {
      modalApi.setState({
        loading: false,
      });
    }
  },
});
</script>

<template>
  <Modal class="w-[calc(100vw-32px)] max-w-[1320px] overflow-x-hidden">
    <div class="finance-statement-modal grid min-h-[320px] gap-4">
      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="text-base font-medium">周期信息</div>
          <ElTag effect="plain" round type="info">
            {{ cycleInfo?.cycleText || '-' }}
          </ElTag>
          <ElTag
            v-if="cycleInfo?.bizType"
            :type="getBizTypeTagType(cycleInfo.bizType)"
            effect="plain"
            round
          >
            {{ cycleInfo.bizType }}
          </ElTag>
        </div>
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="finance-statement-filters">
          <div class="finance-statement-field">
            <div class="finance-statement-label">关键词</div>
            <ElInput
              v-model="filters.keyword"
              class="w-full"
              clearable
              placeholder="订单号、退款单号、用户、联系人、收货人"
            />
          </div>

          <div class="finance-statement-field">
            <div class="finance-statement-label">流水类型</div>
            <ElSelect
              v-model="filters.flow_type"
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

          <div class="finance-statement-field">
            <div class="finance-statement-label">支付方式</div>
            <ElSelect
              v-model="filters.pay_type"
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

          <div class="finance-statement-field">
            <div class="finance-statement-label">平台来源</div>
            <ElSelect
              v-model="filters.platform"
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

          <div class="finance-statement-field">
            <div class="finance-statement-label">订单状态</div>
            <ElSelect
              v-model="filters.order_status"
              class="w-full"
              clearable
              placeholder="请选择"
            >
              <ElOption
                v-for="item in getOrderStatusOptions(cycleInfo?.bizType)"
                :key="`${item.biz_type}-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>

          <div class="finance-statement-field">
            <div class="finance-statement-label">退款状态</div>
            <ElSelect
              v-model="filters.refund_status"
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
          <ElButton @click="resetFilters">重置</ElButton>
          <ElButton type="primary" @click="reloadFromFirstPage">搜索</ElButton>
        </div>
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">周期对账明细</div>

        <div v-loading="detailLoading" class="finance-statement-table-wrap">
          <div class="finance-statement-table-inner">
            <ElTable
              v-if="rows.length > 0"
              :data="rows"
              border
              row-key="__row_key"
            >
              <ElTableColumn label="业务时间" min-width="170" prop="occur_time_text" />
              <ElTableColumn label="流水类型" min-width="100">
                <template #default="{ row }">
                  <ElTag :type="getFlowTypeTagType(row.flow_type)" effect="light" round>
                    {{ row.flow_type_text || row.flow_type || '-' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="业务类型" min-width="100">
                <template #default="{ row }">
                  <ElTag :type="getBizTypeTagType(row.biz_type)" effect="plain" round>
                    {{ row.biz_type_text || row.biz_type || '-' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="下单用户" min-width="180">
                <template #default="{ row }">
                  <OrderUserPopover :user-info="row.user_info" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="联系人/收货人" min-width="120" prop="contact_name" />
              <ElTableColumn label="联系手机号" min-width="140" prop="contact_mobile" />
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
              <ElTableColumn label="支付方式" min-width="110" prop="pay_type_text" />
              <ElTableColumn label="平台来源" min-width="120" prop="platform_text" />
              <ElTableColumn label="订单号" min-width="170" prop="order_sn" />
              <ElTableColumn label="退款单号" min-width="170" prop="refund_sn" />
              <ElTableColumn label="收入金额" min-width="100" prop="income_amount" />
              <ElTableColumn label="退款金额" min-width="100" prop="refund_amount" />
              <ElTableColumn label="净额" min-width="100" prop="net_amount" />
              <ElTableColumn label="订单状态" min-width="110">
                <template #default="{ row }">
                  <ElTag
                    :type="getProcessStatusTagType(row.order_status, row.order_status_text)"
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
                    :type="getProcessStatusTagType(row.refund_status, row.refund_status_text)"
                    effect="light"
                    round
                  >
                    {{ row.refund_status_text || row.refund_status || '-' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="备注" min-width="180" prop="remark" />
            </ElTable>

            <ElEmpty
              v-else
              description="当前筛选条件下没有对账明细数据"
              :image-size="90"
            />
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-muted-foreground">
            共 {{ total }} 条记录
          </div>
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            background
            layout="prev, pager, next, sizes"
            :page-sizes="pageSizeOptions"
            :total="total"
            @current-change="loadDetail"
            @size-change="reloadFromFirstPage"
          />
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.finance-statement-modal {
  grid-template-columns: minmax(0, 1fr);
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  width: 100%;
}

.finance-statement-modal > * {
  max-width: 100%;
  min-width: 0;
}

.finance-statement-filters {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  max-width: 100%;
  min-width: 0;
}

.finance-statement-field {
  min-width: 0;
  max-width: 100%;
}

.finance-statement-field :deep(.el-input),
.finance-statement-field :deep(.el-select) {
  max-width: 100%;
  min-width: 0;
  width: 100%;
}

.finance-statement-label {
  margin-bottom: 8px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.finance-statement-table-wrap {
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  width: 100%;
}

.finance-statement-table-inner {
  display: block;
  min-width: 1660px;
  width: 1660px;
}

.finance-statement-table-inner :deep(.el-table) {
  min-width: 100%;
  width: 100%;
}

@media (max-width: 1024px) {
  .finance-statement-filters {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .finance-statement-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .finance-statement-table-inner {
    min-width: 1480px;
    width: 1480px;
  }

  .finance-statement-table-inner :deep(.el-table) {
    min-width: 100%;
    width: 100%;
  }
}
</style>
