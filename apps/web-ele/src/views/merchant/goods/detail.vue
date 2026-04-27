<script lang="ts" setup>
import type {
  MerchantGoodsDetail,
  MerchantGoodsMetaResult,
  MerchantGoodsSkuPayload,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AnalysisChartCard, Page } from '@vben/common-ui';
import { VbenTiptapPreview } from '@vben/plugins/tiptap';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElImage,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getGoodsDetailApi, getGoodsOptionsApi } from '#/api';

defineOptions({ name: 'MerchantGoodsDetailPage' });

interface GoodsTreeOption {
  children?: GoodsTreeOption[];
  id: number | string;
  name: string;
}

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<MerchantGoodsDetail | null>(null);
const sku = ref<MerchantGoodsSkuPayload | null>(null);
const metaRef = ref<MerchantGoodsMetaResult | null>(null);

function formatDateTime(timestamp: null | number | undefined) {
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

function flattenTreeOptions(items: GoodsTreeOption[] = []) {
  return items.reduce<Map<number, string>>((result, item) => {
    result.set(Number(item.id), item.name);
    if (item.children?.length) {
      flattenTreeOptions(item.children).forEach((value, key) => {
        result.set(key, value);
      });
    }
    return result;
  }, new Map());
}

const categoryLabels = computed(() => {
  const categoryMap = flattenTreeOptions(
    (metaRef.value?.category_options || []) as GoodsTreeOption[],
  );
  return (detail.value?.category_ids || [])
    .map((id) => categoryMap.get(Number(id)))
    .filter(Boolean) as string[];
});

const dispatchInfo = computed(() => {
  const dispatch = metaRef.value?.dispatch_options.find(
    (item) => item.id === detail.value?.dispatch_id,
  );
  return dispatch || null;
});

const singleSkuDetail = computed(() => {
  return sku.value?.mode === 'single' ? sku.value.detail || null : null;
});

const multiSkuRows = computed(() => {
  return sku.value?.mode === 'multiple' ? sku.value.price || [] : [];
});

async function loadDetail() {
  const id = Number(route.params.id || 0);
  if (!id) {
    ElMessage.error('商品参数错误');
    return;
  }

  loading.value = true;
  try {
    const [detailResponse, metaResponse] = await Promise.all([
      getGoodsDetailApi(id),
      getGoodsOptionsApi(),
    ]);
    detail.value = detailResponse.detail;
    sku.value = detailResponse.sku;
    metaRef.value = metaResponse;
  } catch (error) {
    console.error(error);
    ElMessage.error('商品详情加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <Page
    auto-content-height
    description="商品内容由商家维护，保存后会重新进入审核流。多规格商品的规格组合与库存请在独立 SKU 页维护。"
    title="商品详情"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/goods/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/goods/sku/${route.params.id}`)">SKU 管理</ElButton>
        <ElButton type="primary" @click="router.push(`/goods/edit/${route.params.id}`)">
          编辑商品
        </ElButton>
      </div>
    </template>

    <div v-loading="loading" class="grid gap-4">
      <AnalysisChartCard title="基础信息">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="商品标题">
            {{ detail?.title || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="商品类型">
            {{ detail?.type_text || detail?.type || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="副标题" :span="2">
            {{ detail?.subtitle || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上下架状态">
            <ElTag
              :type="detail?.status === 'up' ? 'success' : 'info'"
              effect="light"
              round
            >
              {{ detail?.status_text || detail?.status || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审核状态">
            <ElTag
              :type="
                detail?.audit_status === '1'
                  ? 'success'
                  : detail?.audit_status === '2'
                    ? 'danger'
                    : 'warning'
              "
              effect="light"
              round
            >
              {{ detail?.audit_status_text || detail?.audit_status || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="销售价">
            {{ detail?.price || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="原价">
            {{ detail?.original_price || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="规格模式">
            {{ detail?.is_sku === 1 ? '多规格' : '单规格' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="总库存">
            {{ detail?.stock ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="浏览量">
            {{ detail?.views ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="收藏量">
            {{ detail?.likes ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="销量">
            {{ detail?.sales ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发货方式">
            {{ dispatchInfo?.type_text || detail?.dispatch_type || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发货模板">
            {{ dispatchInfo?.name || detail?.dispatch_id || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ formatDateTime(detail?.createtime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ formatDateTime(detail?.updatetime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审核时间">
            {{ formatDateTime(detail?.audit_time) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem
            v-if="detail?.audit_remark"
            :span="2"
            label="驳回原因"
          >
            {{ detail.audit_remark }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div
          v-if="detail?.audit_status === '0'"
          class="mt-4 rounded-xl border border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)] px-4 py-3 text-sm text-muted-foreground"
        >
          当前商品内容待平台审核，审核通过后才允许重新上架。
        </div>

        <div
          v-else-if="detail?.audit_status === '2'"
          class="mt-4 rounded-xl border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-4 py-3 text-sm text-muted-foreground"
        >
          当前商品审核已被驳回，请根据驳回原因修改后重新提交。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="分类与媒体">
        <div class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div class="space-y-3">
            <div class="text-sm font-medium">商品主图</div>
            <div class="overflow-hidden rounded-xl border bg-muted/20">
              <ElImage
                v-if="detail?.image"
                :preview-src-list="[detail.image]"
                :src="detail.image"
                class="goods-main-image w-full"
                fit="contain"
                preview-teleported
              />
              <div
                v-else
                class="flex h-[280px] items-center justify-center p-4 text-sm text-muted-foreground"
              >
                暂无主图
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-sm font-medium">商品分类</div>
              <div v-if="categoryLabels.length" class="flex flex-wrap gap-2">
                <ElTag v-for="item in categoryLabels" :key="item" effect="plain" round>
                  {{ item }}
                </ElTag>
              </div>
              <ElEmpty v-else description="暂无分类信息" :image-size="80" />
            </div>
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">轮播图</div>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="item in detail?.images || []"
                :key="item"
                class="goods-carousel-card overflow-hidden rounded-md border bg-muted/20"
              >
                <ElImage
                  :preview-src-list="detail?.images || []"
                  :src="item"
                  class="goods-carousel-image h-full w-full"
                  fit="contain"
                  preview-teleported
                />
              </div>
              <div
                v-if="!(detail?.images && detail.images.length)"
                class="goods-carousel-card flex items-center justify-center rounded-md border p-4 text-sm text-muted-foreground"
              >
                暂无轮播图
              </div>
            </div>
          </div>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="参数详情">
        <div v-if="detail?.params?.length" class="grid gap-3">
          <div
            v-for="(item, index) in detail?.params || []"
            :key="`${item.title}-${index}`"
            class="grid gap-3 rounded-xl border p-4 md:grid-cols-[180px_minmax(0,1fr)]"
          >
            <div class="text-sm font-medium">{{ item.title || '-' }}</div>
            <div class="text-sm text-muted-foreground">{{ item.content || '-' }}</div>
          </div>
        </div>
        <div
          v-else
          class="rounded-xl border p-4 text-sm text-muted-foreground"
        >
          当前商品还没有参数详情。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="SKU 摘要">
        <div v-if="detail?.is_sku === 0" class="grid gap-3">
          <div class="rounded-xl border p-4">
            <div class="mb-3 text-sm font-medium">单规格库存</div>
            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-5">
              <div>售价：{{ singleSkuDetail?.price || detail?.price || '-' }}</div>
              <div>库存：{{ singleSkuDetail?.stock ?? detail?.stock ?? '-' }}</div>
              <div>货号：{{ singleSkuDetail?.sn || '-' }}</div>
              <div>重量：{{ singleSkuDetail?.weight || '-' }}</div>
              <div>状态：{{ singleSkuDetail?.status || '-' }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="multiSkuRows.length" class="grid gap-3">
          <ElTable :data="multiSkuRows" border>
            <ElTableColumn label="规格组合" min-width="220">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-2">
                  <ElTag
                    v-for="item in row.goods_sku_text"
                    :key="item"
                    effect="plain"
                    round
                  >
                    {{ item }}
                  </ElTag>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="图片" width="90">
              <template #default="{ row }">
                <ElImage
                  v-if="row.image"
                  :preview-src-list="[row.image]"
                  :src="row.image"
                  class="h-12 w-12 rounded-md border"
                  fit="cover"
                  preview-teleported
                />
                <span v-else class="text-xs text-muted-foreground">-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="售价" prop="price" width="110" />
            <ElTableColumn label="原价" prop="original_price" width="110" />
            <ElTableColumn label="成本价" prop="cost_price" width="110" />
            <ElTableColumn label="库存" prop="stock" width="90" />
            <ElTableColumn label="货号" prop="sn" min-width="140" />
            <ElTableColumn label="重量" prop="weight" width="100" />
            <ElTableColumn label="状态" width="100">
              <template #default="{ row }">
                <ElTag
                  :type="row.status === 'up' ? 'success' : 'info'"
                  effect="plain"
                  round
                >
                  {{ row.status === 'up' ? '上架' : '下架' }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <div
          v-else
          class="rounded-xl border p-4 text-sm text-muted-foreground"
        >
          当前商品还没有 SKU 数据。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="图文详情">
        <VbenTiptapPreview
          :content="detail?.content || ''"
          :min-height="180"
        />
      </AnalysisChartCard>
    </div>
  </Page>
</template>

<style scoped>
.goods-main-image {
  height: 280px;
}

.goods-carousel-card {
  height: 150px;
  width: 220px;
}

.goods-carousel-image {
  padding: 8px;
}

@media (max-width: 768px) {
  .goods-main-image {
    height: 220px;
  }

  .goods-carousel-card {
    width: 100%;
  }
}
</style>
