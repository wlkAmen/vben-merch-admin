<script lang="ts" setup>
import type { MerchantLineSuitItem } from '#/api';
import type {
  EditableLinePriceMap,
  LinePriceEditorForm,
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
  getLineSuitDetailApi,
  getLineSuitListApi,
  updateLineSuitApi,
} from '#/api';

import PriceEditorModal from './modules/price-editor.vue';
import {
  applyEditorFormToPriceMap,
  buildLinePriceMap,
  buildLinePriceSummaryFromMap,
  formatLineDateRange,
  formatLinePriceRange,
  formatLinePriceValue,
  serializeLinePriceMap,
} from './price-helper';

defineOptions({ name: 'MerchantLinePricePage' });

interface SuitPriceState {
  detail: MerchantLineSuitItem | null;
  loaded: boolean;
  loading: boolean;
  priceMap: EditableLinePriceMap;
}

const route = useRoute();
const router = useRouter();

const lineId = computed(() => Number(route.params.id || 0));
const keyword = ref('');
const calendarCursor = ref(new Date());
const suitList = ref<MerchantLineSuitItem[]>([]);
const suitListLoading = ref(false);
const selectedSuitId = ref<number | null>(null);
const saving = ref(false);
const preferredSuitId = computed(() => Number(route.query.suitId || 0) || null);

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

const filteredSuits = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  if (!normalizedKeyword) {
    return suitList.value;
  }

  return suitList.value.filter((item) => {
    return [item.name, item.content]
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
  buildLinePriceSummaryFromMap(activePriceMap.value),
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

function hasMeaningfulPrice(value?: string) {
  return !!value && value !== '-';
}

function getSuitSummaryText(suitId: number) {
  const state = suitStateMap[suitId];
  if (!state?.loaded) {
    return '点击后加载价格日历';
  }

  const summary = buildLinePriceSummaryFromMap(state.priceMap);
  if (summary.dateCount === 0) {
    return '暂无日期价格';
  }

  return `${summary.dateCount} 条日期 / ${formatLinePriceRange(summary)}`;
}

function getPriceCell(day: string) {
  return activePriceMap.value[day];
}

function resetCalendarCursor() {
  calendarCursor.value = new Date();
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
    const response = await getLineSuitDetailApi(suitId);
    state.detail = response.detail;
    state.priceMap = buildLinePriceMap(response.detail.price_info || []);
    state.loaded = true;
    return state.detail;
  } catch (error) {
    console.error(error);
    ElMessage.error('套餐价格库存加载失败，请稍后重试');
    return null;
  } finally {
    state.loading = false;
  }
}

async function loadSuitList() {
  if (!lineId.value) {
    ElMessage.error('线路参数错误');
    return;
  }

  suitListLoading.value = true;
  try {
    const response = await getLineSuitListApi({
      line_id: lineId.value,
      page: 1,
      page_size: 200,
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
    ElMessage.error('线路套餐列表加载失败，请稍后重试');
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
  form: LinePriceEditorForm;
  matchedDates: string[];
}) {
  if (!selectedSuitId.value) {
    return;
  }

  try {
    const state = ensureSuitState(selectedSuitId.value);
    const result = applyEditorFormToPriceMap(
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
    priceInfo = serializeLinePriceMap(activePriceMap.value);
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '价格库存校验失败',
    );
    return;
  }

  saving.value = true;
  try {
    await updateLineSuitApi({
      child: activeSuitDetail.value.child,
      content: activeSuitDetail.value.content,
      id: activeSuitDetail.value.id,
      line_id: activeSuitDetail.value.lineid,
      name: activeSuitDetail.value.name,
      oldperson: activeSuitDetail.value.oldperson,
      person: activeSuitDetail.value.person,
      price: activeSuitDetail.value.price,
      priceinfo: priceInfo,
      room: activeSuitDetail.value.room,
    });

    await ensureSuitDetail(selectedSuitId.value, true);
    dirtySuitMap[selectedSuitId.value] = false;
    ElMessage.success('当前套餐价格库存已保存');
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

onMounted(() => {
  loadSuitList();
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
    description="按套餐切换维护线路价格库存，支持单日编辑和批量套用。"
    title="线路价格库存"
  >
    <template #extra>
      <div class="flex flex-wrap gap-2">
        <ElButton @click="router.push('/line/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/line/suit/${lineId}`)">套餐管理</ElButton>
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
            placeholder="按套餐名称或说明筛选"
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
              :class="
                selectedSuitId === suit.id
                  ? 'is-active'
                  : ''
              "
              type="button"
              @click="handleSelectSuit(suit.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="line-clamp-1 text-sm font-semibold">{{ suit.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ getSuitSummaryText(suit.id) }}
                  </div>
                  <div
                    v-if="suit.content"
                    class="line-clamp-1 text-xs text-muted-foreground"
                  >
                    {{ suit.content }}
                  </div>
                </div>

                <div class="flex flex-col items-end gap-2">
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
            :description="suitList.length === 0 ? '当前线路还没有套餐，请先去套餐管理页新增套餐。' : '没有匹配到符合条件的套餐。'"
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
                <ElTag effect="plain" round>
                  当前套餐
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
                  <span class="price-meta-chip__label">成人标准：</span>
                  <span class="price-meta-chip__value">
                    {{ activeSuitDetail?.person || '-' }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">老人标准：</span>
                  <span class="price-meta-chip__value">
                    {{ activeSuitDetail?.oldperson || '-' }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">儿童标准：</span>
                  <span class="price-meta-chip__value">
                    {{ activeSuitDetail?.child || '-' }}
                  </span>
                </div>
                <div class="price-meta-chip">
                  <span class="price-meta-chip__label">单房差：</span>
                  <span class="price-meta-chip__value">
                    {{ activeSuitDetail?.room || '-' }}
                  </span>
                </div>
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
                  {{ formatLineDateRange(activeSummary) }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  当前套餐价格日历覆盖范围
                </div>
              </div>
            </AnalysisChartCard>

            <AnalysisChartCard class="h-full" title="成人售价区间">
              <div class="price-summary-box rounded-2xl px-4 py-2.5">
                <div class="text-sm font-semibold">
                  {{ formatLinePriceRange(activeSummary) }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  当前套餐已配置的成人售价范围
                </div>
              </div>
            </AnalysisChartCard>
          </div>

          <div class="price-surface rounded-2xl p-4">
            <div class="mb-4">
              <div>
                <div class="text-base font-medium">价格日历</div>
                <div class="text-xs text-muted-foreground">
                  点击任意日期可维护单日报价，使用“批量设置”可快速覆盖一段日期。
                </div>
              </div>
            </div>

            <ElCalendar v-model="calendarCursor">
              <template #date-cell="{ data }">
                <button
                  class="line-price-calendar-cell flex h-full w-full flex-col items-start gap-1 rounded-lg border border-transparent p-2 text-left transition hover:border-primary/50 hover:bg-primary/5"
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
                      成人：{{ formatLinePriceValue(getPriceCell(data.day)?.price) }}
                    </div>
                    <div class="text-xs leading-5 text-muted-foreground">
                      老人：{{ formatLinePriceValue(getPriceCell(data.day)?.elderprice) }}
                    </div>
                    <div class="text-xs leading-5 text-muted-foreground">
                      儿童：{{ formatLinePriceValue(getPriceCell(data.day)?.childprice) }}
                    </div>
                    <div class="text-xs leading-5 text-muted-foreground">
                      库存：{{ formatLinePriceValue(getPriceCell(data.day)?.stock) }}
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
        description="当前线路还没有可维护的套餐，请先到套餐管理页新增套餐。"
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
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  background: hsl(var(--muted));
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 34px;
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
  height: 168px;
  padding: 4px;
}

:deep(.el-calendar__body) {
  padding-top: 8px;
}

.line-price-calendar-cell {
  min-height: 156px;
}

@media (max-width: 1280px) {
  :deep(.el-calendar-table .el-calendar-day) {
    height: 148px;
  }

  .line-price-calendar-cell {
    min-height: 136px;
  }
}
</style>
