<script lang="ts" setup>
import type { MerchantGoodsDetail } from '#/api';
import type { GoodsSkuEditorRow, GoodsSpecGroup } from './sku-helper';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AnalysisChartCard, Page } from '@vben/common-ui';

import { ElButton, ElEmpty, ElInput, ElInputNumber, ElMessage, ElRadio, ElRadioGroup, ElTag } from 'element-plus';

import {
  getGoodsDetailApi,
  saveGoodsSkuApi,
} from '#/api';
import GoodsSkuImageUpload from './modules/sku-image-upload.vue';

import {
  applyGoodsSkuBatchFill,
  createEmptyGoodsSpecGroup,
  createEmptyGoodsSpecValue,
  createGoodsSkuBatchFillForm,
  normalizeGoodsSpecData,
  serializeGoodsSkuGroups,
  serializeGoodsSkuRows,
  syncGoodsSkuRows,
  validateGoodsSkuRows,
  validateGoodsSpecGroups,
} from './sku-helper';

defineOptions({ name: 'MerchantGoodsSkuPage' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const detail = ref<MerchantGoodsDetail | null>(null);
const specGroups = ref<GoodsSpecGroup[]>([]);
const skuRows = ref<GoodsSkuEditorRow[]>([]);
const seed = ref(1);
const skuBatchFillForm = ref(createGoodsSkuBatchFillForm());

const goodsId = computed(() => Number(route.params.id || 0));
const isMultipleSku = computed(() => detail.value?.is_sku === 1);

function createSeed() {
  const current = seed.value;
  seed.value += 1;
  return current;
}

function addSpecGroup() {
  specGroups.value.push(createEmptyGoodsSpecGroup(createSeed()));
}

function removeSpecGroup(index: number) {
  specGroups.value.splice(index, 1);
}

function addSpecValue(groupIndex: number) {
  specGroups.value[groupIndex]?.values.push(createEmptyGoodsSpecValue(createSeed()));
}

function removeSpecValue(groupIndex: number, valueIndex: number) {
  specGroups.value[groupIndex]?.values.splice(valueIndex, 1);
}

function syncRowsFromGroups() {
  const normalizedGroups = specGroups.value.map((group) => ({
    ...group,
    values: group.values.filter((value) => value.name.trim()),
  }));
  skuRows.value = syncGoodsSkuRows(normalizedGroups, skuRows.value);
}

function getCombinationKey(row: GoodsSkuEditorRow) {
  return row.goods_sku_text.join(' / ');
}

function handleApplyBatchFillToSkuRows() {
  try {
    skuRows.value = applyGoodsSkuBatchFill(skuRows.value, skuBatchFillForm.value);
    ElMessage.success(`已批量填充 ${skuRows.value.length} 条规格记录`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '批量填充失败');
  }
}

function resetSkuBatchFillForm() {
  skuBatchFillForm.value = createGoodsSkuBatchFillForm();
}

async function loadDetail() {
  if (!goodsId.value) {
    ElMessage.error('商品参数错误');
    return;
  }

  loading.value = true;
  try {
    const response = await getGoodsDetailApi(goodsId.value);
    detail.value = response.detail;

    if (response.detail.is_sku !== 1) {
      specGroups.value = [];
      skuRows.value = [];
      resetSkuBatchFillForm();
      return;
    }

    const normalized = normalizeGoodsSpecData(
      response.sku.list || [],
      response.sku.price || [],
    );

    specGroups.value = normalized.groups;
    skuRows.value = normalized.rows;
    seed.value = normalized.nextSeed;
    resetSkuBatchFillForm();
  } catch (error) {
    console.error(error);
    ElMessage.error('SKU 数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!detail.value || detail.value.is_sku !== 1) {
    ElMessage.warning('当前商品不是多规格商品');
    return;
  }

  try {
    validateGoodsSpecGroups(specGroups.value);
    validateGoodsSkuRows(skuRows.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'SKU 校验失败');
    return;
  }

  saving.value = true;
  try {
    await saveGoodsSkuApi({
      goods_id: detail.value.id,
      listData: serializeGoodsSkuGroups(specGroups.value),
      priceData: serializeGoodsSkuRows(skuRows.value),
    });
    ElMessage.success('SKU 已保存');
    await loadDetail();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

watch(
  () =>
    specGroups.value.map((group) => ({
      id: group.id,
      name: group.name,
      values: group.values.map((value) => ({
        id: value.id,
        name: value.name,
        tempId: value.tempId,
      })),
    })),
  () => {
    if (!isMultipleSku.value) {
      return;
    }
    syncRowsFromGroups();
  },
  { deep: true },
);

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <Page
    auto-content-height
    :description="detail?.title || '维护多规格商品的规格组合、价格与库存。'"
    title="SKU 管理"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/goods/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/goods/detail/${goodsId}`)">商品详情</ElButton>
        <ElButton @click="router.push(`/goods/edit/${goodsId}`)">编辑商品</ElButton>
        <ElButton :loading="saving" type="primary" @click="handleSave">
          保存 SKU
        </ElButton>
      </div>
    </template>

    <div v-loading="loading" class="grid gap-4">
      <AnalysisChartCard title="商品信息">
        <div class="flex flex-wrap items-center gap-3">
          <strong class="text-xl">{{ detail?.title || '-' }}</strong>
          <ElTag effect="plain" round>
            {{ detail?.type_text || detail?.type || '-' }}
          </ElTag>
          <ElTag
            :type="detail?.audit_status === '1' ? 'success' : detail?.audit_status === '2' ? 'danger' : 'warning'"
            effect="light"
            round
          >
            {{ detail?.audit_status_text || detail?.audit_status || '-' }}
          </ElTag>
        </div>

        <div
          v-if="detail?.audit_status === '2' && detail.audit_remark"
          class="mt-4 rounded-xl border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-4 py-3 text-sm text-muted-foreground"
        >
          驳回原因：{{ detail.audit_remark }}
        </div>
      </AnalysisChartCard>

      <template v-if="isMultipleSku">
        <AnalysisChartCard title="规格结构">
          <div class="grid gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3">
              <div>
                <div class="text-sm font-medium">先维护规格组和规格值，再自动生成规格组合。</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  当前规格组：{{ specGroups.length }} 组
                  <span class="mx-2">/</span>
                  当前规格组合：{{ skuRows.length }} 条
                </div>
              </div>

              <ElButton type="primary" plain @click="addSpecGroup">
                新增规格组
              </ElButton>
            </div>

            <div v-if="specGroups.length > 0" class="grid gap-4">
              <div
                v-for="(group, groupIndex) in specGroups"
                :key="group.id || groupIndex"
                class="rounded-2xl bg-muted/20 p-4"
              >
                <div class="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                  <div class="space-y-2">
                    <div class="text-xs text-muted-foreground">规格组名称</div>
                    <ElInput
                      v-model="group.name"
                      class="max-w-[260px]"
                      placeholder="例如：颜色 / 尺寸"
                    />
                  </div>

                  <div class="flex flex-wrap gap-2 xl:justify-end">
                    <ElButton plain type="primary" @click="addSpecValue(groupIndex)">
                      新增规格值
                    </ElButton>
                    <ElButton type="danger" @click="removeSpecGroup(groupIndex)">
                      删除规格组
                    </ElButton>
                  </div>
                </div>

                <div v-if="group.values.length > 0" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="(value, valueIndex) in group.values"
                    :key="value.tempId"
                    class="flex items-center gap-2 rounded-xl bg-background p-3 shadow-sm"
                  >
                    <ElInput v-model="value.name" placeholder="请输入规格值" />
                    <ElButton type="danger" @click="removeSpecValue(groupIndex, valueIndex)">
                      删除
                    </ElButton>
                  </div>
                </div>

                <ElEmpty
                  v-else
                  description="当前规格组还没有规格值"
                  :image-size="80"
                />
              </div>
            </div>

            <ElEmpty
              v-else
              description="当前还没有规格组，点击右上角“新增规格组”开始维护"
              :image-size="100"
            />
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard title="规格价格表">
          <div class="mb-4 rounded-xl border bg-muted/20 p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">批量填充</div>
                <div class="text-xs text-muted-foreground">
                  只会覆盖已填写的字段，未填写的字段保持原值。
                </div>
              </div>

              <div class="text-xs text-muted-foreground">
                当前规格：{{ skuRows.length }} 条
              </div>
            </div>

            <div class="goods-sku-batch-fill grid gap-3 lg:grid-cols-4">
              <ElInput
                v-model="skuBatchFillForm.price"
                placeholder="批量填充销售价"
              />
              <ElInput
                v-model="skuBatchFillForm.original_price"
                placeholder="批量填充原价"
              />
              <ElInput
                v-model="skuBatchFillForm.cost_price"
                placeholder="批量填充成本价"
              />
              <ElInputNumber
                v-model="skuBatchFillForm.stock"
                :controls="false"
                :min="0"
                class="w-full"
                placeholder="批量填充库存"
              />
            </div>

            <div class="mt-3 flex justify-end gap-2">
              <ElButton type="primary" @click="handleApplyBatchFillToSkuRows">
                应用到全部规格
              </ElButton>
              <ElButton @click="resetSkuBatchFillForm">
                清空
              </ElButton>
            </div>
          </div>

          <div v-if="skuRows.length > 0" class="overflow-x-auto">
            <table class="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr class="bg-muted/20 text-center">
                  <th class="border px-3 py-2 font-medium">规格组合</th>
                  <th class="border px-3 py-2 font-medium">图片</th>
                  <th class="border px-3 py-2 font-medium">售价</th>
                  <th class="border px-3 py-2 font-medium">原价</th>
                  <th class="border px-3 py-2 font-medium">成本价</th>
                  <th class="border px-3 py-2 font-medium">库存</th>
                  <th class="border px-3 py-2 font-medium">重量</th>
                  <th class="border px-3 py-2 font-medium">货号</th>
                  <th class="border px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in skuRows" :key="getCombinationKey(row)">
                  <td class="border px-3 py-2">
                    <div class="flex flex-wrap gap-2 justify-center">
                      <ElTag
                        v-for="item in row.goods_sku_text"
                        :key="item"
                        effect="plain"
                        round
                      >
                        {{ item }}
                      </ElTag>
                    </div>
                  </td>
                  <td class="border px-2 py-2 text-center">
                    <GoodsSkuImageUpload v-model="row.image" />
                  </td>
                  <td class="border px-3 py-2 text-center"><ElInput v-model="row.price" placeholder="售价" /></td>
                  <td class="border px-3 py-2 text-center"><ElInput v-model="row.original_price" placeholder="原价" /></td>
                  <td class="border px-3 py-2 text-center"><ElInput v-model="row.cost_price" placeholder="成本价" /></td>
                  <td class="border px-3 py-2 text-center">
                    <ElInputNumber
                      v-model="row.stock"
                      :controls="false"
                      :min="0"
                      class="w-full"
                      placeholder="库存"
                    />
                  </td>
                  <td class="border px-3 py-2"><ElInput v-model="row.weight" placeholder="重量" /></td>
                  <td class="border px-3 py-2"><ElInput v-model="row.sn" placeholder="货号" /></td>
                  <td class="border px-3 py-2 text-center">
                    <ElRadioGroup v-model="row.status">
                      <ElRadio value="up">上架</ElRadio>
                      <ElRadio value="down">下架</ElRadio>
                    </ElRadioGroup>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ElEmpty
            v-else
            description="当前还没有可用的规格组合，请先完善上方规格结构。"
            :image-size="100"
          />
        </AnalysisChartCard>
      </template>

      <AnalysisChartCard v-else title="SKU 管理">
        <div class="rounded-xl border border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)] px-4 py-3 text-sm text-muted-foreground">
          当前商品是单规格商品，不需要进入独立 SKU 管理页。你可以回到商品编辑页直接维护库存、货号和重量。
        </div>
      </AnalysisChartCard>
    </div>
  </Page>
</template>

<style scoped>
:deep(.goods-sku-batch-fill .el-input),
:deep(.goods-sku-batch-fill .el-input-number) {
  width: 100%;
}
</style>
