<script lang="ts" setup>
import type { MerchantTicketMetaResult, MerchantTicketSuitItem } from '#/api';
import type {
  EditableTicketPriceMap,
  TicketPriceEditorForm,
} from './price-helper';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { AnalysisChartCard, ColPage, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCalendar,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElSkeletonItem,
  ElTag,
} from 'element-plus';

import {
  getTicketOptionsApi,
  getTicketSuitDetailApi,
  getTicketSuitListApi,
  updateTicketSuitApi,
} from '#/api';

import PriceEditorModal from './modules/price-editor.vue';
import {
  applyTicketEditorFormToPriceMap,
  buildTicketPriceMap,
  buildTicketPriceSummaryFromMap,
  formatTicketDateRange,
  formatTicketPriceRange,
  formatTicketPriceValue,
  serializeTicketPriceMap,
} from './price-helper';

defineOptions({ name: 'MerchantTicketPricePage' });

interface SuitPriceState {
  detail: MerchantTicketSuitItem | null;
  loaded: boolean;
  loading: boolean;
  priceMap: EditableTicketPriceMap;
}

const route = useRoute();
const router = useRouter();

const ticketId = computed(() => Number(route.params.id || 0));
const keyword = ref('');
const calendarCursor = ref(new Date());
const suitList = ref<MerchantTicketSuitItem[]>([]);
const suitListLoading = ref(false);
const selectedSuitId = ref<number | null>(null);
const saving = ref(false);
const preferredSuitId = computed(() => Number(route.query.suitId || 0) || null);
const metaRef = ref<MerchantTicketMetaResult | null>(null);

const suitStateMap = reactive<Record<number, SuitPriceState>>({});
const dirtySuitMap = reactive<Record<number, boolean>>({});

const [EditorModal, editorModalApi] = useVbenModal({
  connectedComponent: PriceEditorModal,
  destroyOnClose: true,
});

function ensureSuitState(suitId: number) {
  if (!suitStateMap[suitId]) {
    suitStateMap[suitId] = {
      detail: null,
      loaded: false,
      loading: false,
      priceMap: {},
    };
  }
  return suitStateMap[suitId];
}

function resetCalendarCursor() {
  calendarCursor.value = new Date();
}

function hasMeaningfulPrice(value?: string) {
  return !!value && value !== '-';
}

function getTypeName(typeId: string) {
  return (
    metaRef.value?.type_options.find((item) => String(item.id) === String(typeId))
      ?.name || typeId || '-'
  );
}

function getPassengerText(value: string) {
  return (
    metaRef.value?.passenger_options.find(
      (item) => String(item.value) === String(value),
    )?.label || value || '-'
  );
}

function getAuditTagType(status: string) {
  switch (status) {
    case '1': {
      return 'success';
    }
    case '2': {
      return 'danger';
    }
    default: {
      return 'warning';
    }
  }
}

function formatBookingRule(detail?: MerchantTicketSuitItem | null) {
  if (!detail) {
    return '-';
  }

  const dayText = detail.before > 0 ? `提前 ${detail.before} 天` : '当天可订';
  if (detail.beforetime) {
    return `${dayText} / ${detail.beforetime} 前`;
  }
  return dayText;
}

const filteredSuits = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  if (!normalizedKeyword) {
    return suitList.value;
  }

  return suitList.value.filter((item) => {
    return [item.name, item.explain, item.content]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

const activeSuitState = computed(() => {
  if (!selectedSuitId.value) {
    return null;
  }
  return ensureSuitState(selectedSuitId.value);
});

const activeSuitDetail = computed(() => activeSuitState.value?.detail || null);

const activePriceMap = computed(() => activeSuitState.value?.priceMap || {});

const activeSummary = computed(() =>
  buildTicketPriceSummaryFromMap(activePriceMap.value),
);

const hasDirtyActiveSuit = computed(() => {
  if (!selectedSuitId.value) {
    return false;
  }
  return !!dirtySuitMap[selectedSuitId.value];
});

const hasAnyDirtySuit = computed(() =>
  Object.values(dirtySuitMap).some(Boolean),
);

function getSuitSummaryText(suitId: number) {
  const state = suitStateMap[suitId];
  if (!state?.loaded) {
    return '点击后加载价格日历';
  }

  const summary = buildTicketPriceSummaryFromMap(state.priceMap);
  if (summary.dateCount === 0) {
    return '暂无日期价格';
  }

  return `${summary.dateCount} 条日期 / ${formatTicketPriceRange(summary)}`;
}

function getPriceCell(day: string) {
  return activePriceMap.value[day];
}

async function confirmLeaveDirtyState(message: string) {
  try {
    await ElMessageBox.confirm(message, '未保存的价格库存', {
      confirmButtonText: '继续切换',
      cancelButtonText: '留在当前页面',
      type: 'warning',
    });
    return true;
  } catch {
    return false;
  }
}

async function ensureSuitDetail(suitId: number, force = false) {
  const state = ensureSuitState(suitId);
  if (state.loaded && !force) {
    return state.detail;
  }
  if (state.loading) {
    return state.detail;
  }

  state.loading = true;
  try {
    const response = await getTicketSuitDetailApi(suitId);
    state.detail = response.detail;
    state.priceMap = buildTicketPriceMap(response.detail.price_info || []);
    state.loaded = true;
    return state.detail;
  } catch (error) {
    console.error(error);
    ElMessage.error('门票套餐价格库存加载失败，请稍后重试');
    return null;
  } finally {
    state.loading = false;
  }
}

async function loadMeta() {
  try {
    metaRef.value = await getTicketOptionsApi();
  } catch (error) {
    console.error(error);
    ElMessage.error('门票元数据加载失败，请稍后重试');
  }
}

async function loadSuitList() {
  if (!ticketId.value) {
    ElMessage.error('门票参数错误');
    return;
  }

  suitListLoading.value = true;
  try {
    const response = await getTicketSuitListApi({
      page: 1,
      page_size: 200,
      ticket_id: ticketId.value,
    });

    suitList.value = response.list || [];
    if (suitList.value.length > 0) {
      const firstSuitId =
        preferredSuitId.value ||
        selectedSuitId.value ||
        suitList.value[0]?.id;
      if (firstSuitId) {
        selectedSuitId.value = firstSuitId;
        await ensureSuitDetail(firstSuitId);
      }
    } else {
      selectedSuitId.value = null;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('门票套餐列表加载失败，请稍后重试');
  } finally {
    suitListLoading.value = false;
  }
}

async function handleSelectSuit(suitId: number) {
  if (selectedSuitId.value === suitId) {
    return;
  }

  if (hasDirtyActiveSuit.value) {
    const confirmed = await confirmLeaveDirtyState(
      '当前套餐还有未保存的价格库存，切换后会保留草稿，但不会自动提交。',
    );
    if (!confirmed) {
      return;
    }
  }

  selectedSuitId.value = suitId;
  resetCalendarCursor();
  await ensureSuitDetail(suitId);
}

function openSingleEditor(day: string) {
  if (!selectedSuitId.value || !activeSuitDetail.value) {
    return;
  }

  editorModalApi
    .setData({
      date: day,
      entry: getPriceCell(day),
      mode: 'single',
      suitName: activeSuitDetail.value.name,
    })
    .open();
}

function openBatchEditor() {
  if (!activeSuitDetail.value) {
    ElMessage.warning('请先选择要维护的套餐');
    return;
  }

  editorModalApi
    .setData({
      mode: 'batch',
      suitName: activeSuitDetail.value.name,
    })
    .open();
}

function handleApplyEditor(payload: {
  action: 'remove' | 'upsert';
  form: TicketPriceEditorForm;
  matchedDates: string[];
}) {
  if (!selectedSuitId.value) {
    return;
  }

  try {
    const state = ensureSuitState(selectedSuitId.value);
    const result = applyTicketEditorFormToPriceMap(
      state.priceMap,
      payload.form,
      payload.action,
    );

    state.priceMap = result.nextMap;
    dirtySuitMap[selectedSuitId.value] = true;

    ElMessage.success(
      payload.action === 'remove'
        ? `已从本地草稿中清空 ${result.matchedDates.length} 天报价`
        : `已写入 ${result.matchedDates.length} 天报价草稿，请记得保存当前套餐`,
    );
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '价格库存草稿更新失败',
    );
  }
}

async function handleReloadActiveSuit() {
  if (!selectedSuitId.value) {
    return;
  }

  if (hasDirtyActiveSuit.value) {
    const confirmed = await confirmLeaveDirtyState(
      '重新加载会丢弃当前套餐尚未保存的价格草稿，确定继续吗？',
    );
    if (!confirmed) {
      return;
    }
  }

  await ensureSuitDetail(selectedSuitId.value, true);
  dirtySuitMap[selectedSuitId.value] = false;
  ElMessage.success('当前套餐价格库存已重新加载');
}

async function handleSaveActiveSuit() {
  if (!selectedSuitId.value || !activeSuitDetail.value) {
    ElMessage.warning('请先选择要维护的套餐');
    return;
  }

  let priceInfo;
  try {
    priceInfo = serializeTicketPriceMap(activePriceMap.value);
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '价格库存校验失败',
    );
    return;
  }

  saving.value = true;
  try {
    await updateTicketSuitApi({
      before: activeSuitDetail.value.before,
      beforetime: activeSuitDetail.value.beforetime,
      content: activeSuitDetail.value.content,
      explain: activeSuitDetail.value.explain,
      id: activeSuitDetail.value.id,
      name: activeSuitDetail.value.name,
      passenger: activeSuitDetail.value.passenger,
      price: activeSuitDetail.value.price,
      priceinfo: priceInfo,
      tags: [...(activeSuitDetail.value.tags || [])],
      type_id: activeSuitDetail.value.type_id,
    });

    await ensureSuitDetail(selectedSuitId.value, true);
    dirtySuitMap[selectedSuitId.value] = false;
    ElMessage.success('当前套餐价格库存已保存，套餐已重新进入待审核');
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

onBeforeRouteLeave(async () => {
  if (!hasAnyDirtySuit.value) {
    return true;
  }

  return await confirmLeaveDirtyState(
    '当前页面还有未保存的价格草稿，离开后这些本地修改会丢失，确定继续吗？',
  );
});

onMounted(async () => {
  await loadMeta();
  await loadSuitList();
});

watch(
  () => preferredSuitId.value,
  async (nextSuitId) => {
    if (
      nextSuitId &&
      nextSuitId !== selectedSuitId.value &&
      suitList.value.some((item) => item.id === nextSuitId)
    ) {
      selectedSuitId.value = nextSuitId;
      resetCalendarCursor();
      await ensureSuitDetail(nextSuitId);
    }
  },
);
</script>

<template>
  <ColPage
    auto-content-height
    description="按套餐切换维护门票价格库存，支持单日编辑和批量套用。"
    title="门票价格库存"
  >
    <template #extra>
      <div class="flex flex-wrap gap-2">
        <ElButton @click="router.push('/ticket/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/ticket/detail/${ticketId}`)">门票详情</ElButton>
        <ElButton @click="router.push(`/ticket/suit/${ticketId}`)">套餐管理</ElButton>
      </div>
    </template>

    <template #left>
      <div class="flex h-full min-h-0 flex-col gap-4 p-1">
        <div class="price-surface shrink-0 space-y-3 rounded-xl p-4">
          <div>
            <div class="text-base font-medium">套餐列表</div>
            <div class="text-xs text-muted-foreground">
              先选择套餐，再在右侧日历维护对应报价。
            </div>
          </div>

          <ElInput
            v-model="keyword"
            clearable
            placeholder="按套餐名称、说明或介绍筛选"
          />
        </div>

        <div class="price-surface min-h-0 flex-1 overflow-y-auto rounded-xl border p-4">
          <div v-if="suitListLoading" class="grid gap-3">
            <ElSkeleton v-for="index in 4" :key="index" animated>
              <template #template>
                <div class="grid gap-2 rounded-lg border p-3">
                  <ElSkeletonItem variant="h3" />
                  <ElSkeletonItem variant="text" />
                  <ElSkeletonItem variant="text" />
                </div>
              </template>
            </ElSkeleton>
          </div>

          <div v-else-if="filteredSuits.length > 0" class="grid gap-3">
            <button
              v-for="suit in filteredSuits"
              :key="suit.id"
              class="price-suit-card rounded-2xl px-4 py-3 text-left transition"
              :class="selectedSuitId === suit.id ? 'is-active' : ''"
              type="button"
              @click="handleSelectSuit(suit.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="line-clamp-1 text-sm font-semibold">{{ suit.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ getSuitSummaryText(suit.id) }}
                  </div>
                  <div v-if="suit.explain" class="line-clamp-1 text-xs text-muted-foreground">
                    {{ suit.explain }}
                  </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                  <ElTag
                    :type="getAuditTagType(suit.audit_status)"
                    effect="light"
                    round
                  >
                    {{ suit.audit_status_text || suit.audit_status || '-' }}
                  </ElTag>

                  <ElTag
                    v-if="dirtySuitMap[suit.id]"
                    effect="plain"
                    round
                    type="warning"
                  >
                    未保存
                  </ElTag>

                  <div
                    v-if="hasMeaningfulPrice(suit.price)"
                    class="rounded-full border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    原价 {{ suit.price }}
                  </div>
                </div>
              </div>
            </button>
          </div>

          <ElEmpty
            v-else
            :description="suitList.length === 0 ? '当前景点还没有可维护的套餐，请先到套餐管理页新增套餐。' : '没有匹配到符合条件的套餐。'"
          />
        </div>
      </div>
    </template>

    <EditorModal @apply="handleApplyEditor" />

    <div class="h-full min-h-0 overflow-y-auto p-1 pr-2">
      <div v-if="selectedSuitId" class="grid auto-rows-max gap-4">
        <div class="price-surface rounded-2xl p-4">
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <strong class="text-xl font-semibold">
                  {{ activeSuitDetail?.name || '加载中...' }}
                </strong>
                <ElTag
                  :type="getAuditTagType(activeSuitDetail?.audit_status || '0')"
                  effect="light"
                  round
                >
                  {{ activeSuitDetail?.audit_status_text || activeSuitDetail?.audit_status || '-' }}
                </ElTag>
              </div>

              <ElTag
                v-if="hasDirtyActiveSuit"
                effect="plain"
                round
                type="warning"
              >
                当前套餐有未保存草稿
              </ElTag>

              <div class="flex flex-wrap gap-2">
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">门票类型：</span>
                  <span class="price-meta-chip__value">
                    {{ getTypeName(activeSuitDetail?.type_id || '') }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">游客信息：</span>
                  <span class="price-meta-chip__value">
                    {{ getPassengerText(activeSuitDetail?.passenger || '') }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">预订规则：</span>
                  <span class="price-meta-chip__value">
                    {{ formatBookingRule(activeSuitDetail) }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">原始价格：</span>
                  <span class="price-meta-chip__value">
                    {{ activeSuitDetail?.price || '-' }}
                  </span>
                </div>
              </div>

              <div
                v-if="activeSuitDetail?.audit_status === '2' && activeSuitDetail.audit_remark"
                class="rounded-xl border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-3 py-2 text-sm text-muted-foreground"
              >
                驳回原因：{{ activeSuitDetail.audit_remark }}
              </div>
            </div>

            <div class="flex flex-wrap gap-2 xl:justify-end">
              <ElButton @click="handleReloadActiveSuit">重新加载</ElButton>
              <ElButton type="primary" plain @click="openBatchEditor">
                批量设置
              </ElButton>
              <ElButton :loading="saving" type="primary" @click="handleSaveActiveSuit">
                保存当前套餐
              </ElButton>
            </div>
          </div>
        </div>

        <template v-if="activeSuitState?.loading && !activeSuitState.detail">
          <ElSkeleton animated>
            <template #template>
              <div class="grid gap-4">
                <div class="grid gap-4 lg:grid-cols-3">
                  <ElSkeletonItem variant="p" />
                  <ElSkeletonItem variant="p" />
                  <ElSkeletonItem variant="p" />
                </div>
                <ElSkeletonItem variant="image" style="height: 520px" />
              </div>
            </template>
          </ElSkeleton>
        </template>

        <template v-else>
          <div class="grid gap-4 lg:grid-cols-3">
            <AnalysisChartCard class="h-full" title="日期条目数">
              <div class="price-summary-box rounded-2xl px-4 py-2.5">
                <div class="text-base font-semibold">
                  {{ activeSummary.dateCount }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  当前套餐已维护的价格日期数量
                </div>
              </div>
            </AnalysisChartCard>

            <AnalysisChartCard class="h-full" title="日期范围">
              <div class="price-summary-box rounded-2xl px-4 py-2.5">
                <div class="text-sm font-semibold">
                  {{ formatTicketDateRange(activeSummary) }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  当前套餐价格日历覆盖范围
                </div>
              </div>
            </AnalysisChartCard>

            <AnalysisChartCard class="h-full" title="销售价区间">
              <div class="price-summary-box rounded-2xl px-4 py-2.5">
                <div class="text-sm font-semibold">
                  {{ formatTicketPriceRange(activeSummary) }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  当前套餐已配置的销售价范围
                </div>
              </div>
            </AnalysisChartCard>
          </div>

          <div class="price-surface rounded-2xl p-4">
            <div class="mb-4">
              <div class="text-base font-medium">价格日历</div>
              <div class="text-xs text-muted-foreground">
                点击任意日期可维护单日报价，使用“批量设置”可快速覆盖一段日期。
              </div>
            </div>

            <ElCalendar v-model="calendarCursor">
              <template #date-cell="{ data }">
                <button
                  class="ticket-price-calendar-cell flex h-full w-full flex-col items-start gap-1 rounded-lg border border-transparent p-2 text-left transition hover:border-primary/50 hover:bg-primary/5"
                  :class="data.type === 'current-month' ? '' : 'opacity-55'"
                  type="button"
                  @click="openSingleEditor(data.day)"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <span class="text-xs font-medium">
                      {{ data.day.split('-').slice(1).join('-') }}
                    </span>
                    <ElTag
                      v-if="getPriceCell(data.day)"
                      effect="plain"
                      round
                      size="small"
                      type="success"
                    >
                      已报价
                    </ElTag>
                  </div>

                  <template v-if="getPriceCell(data.day)">
                    <div class="text-xs leading-5 text-muted-foreground">
                      成本：{{ formatTicketPriceValue(getPriceCell(data.day)?.base_price) }}
                    </div>
                    <div class="text-xs leading-5 text-muted-foreground">
                      售价：{{ formatTicketPriceValue(getPriceCell(data.day)?.price) }}
                    </div>
                    <div class="text-xs leading-5 text-muted-foreground">
                      库存：{{ formatTicketPriceValue(getPriceCell(data.day)?.stock) }}
                    </div>
                  </template>

                  <div
                    v-else
                    class="text-xs leading-5 text-muted-foreground/80"
                  >
                    点击设置报价
                  </div>
                </button>
              </template>
            </ElCalendar>
          </div>
        </template>
      </div>

      <ElEmpty
        v-else
        description="当前景点还没有可维护的套餐，请先到套餐管理页新增套餐。"
      />
    </div>
  </ColPage>
</template>

<style scoped>
.price-surface {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.price-suit-card {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
}

.price-suit-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 10px 24px rgb(15 23 42 / 6%);
}

.price-suit-card.is-active {
  border-color: var(--el-color-primary);
  background: hsl(var(--card));
  box-shadow: 0 12px 26px rgb(15 23 42 / 8%);
}

.price-meta-chip {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 4px;
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  background: hsl(var(--muted));
  padding: 6px 12px;
}

.price-meta-chip__label {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
}

.price-meta-chip__value {
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.price-summary-box {
  height: 100%;
  min-height: 84px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
}

:deep(.el-calendar-table td) {
  vertical-align: top;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 160px;
  padding: 4px;
}

:deep(.el-calendar__body) {
  padding-top: 8px;
}

.ticket-price-calendar-cell {
  min-height: 148px;
}

@media (max-width: 1280px) {
  :deep(.el-calendar-table .el-calendar-day) {
    height: 144px;
  }

  .ticket-price-calendar-cell {
    min-height: 132px;
  }
}
</style>
