<script lang="ts" setup>
import type {
  MerchantLineDetail,
  MerchantLineMetaResult,
  MerchantLineSuitItem,
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
  ElTag,
} from 'element-plus';

import { getLineDetailApi, getLineOptionsApi } from '#/api';

defineOptions({ name: 'MerchantLineDetailPage' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<MerchantLineDetail | null>(null);
const suits = ref<MerchantLineSuitItem[]>([]);
const metaRef = ref<MerchantLineMetaResult | null>(null);

type LineExtraContentKey =
  | 'content1'
  | 'content2'
  | 'content3'
  | 'content4'
  | 'content5';

const selectedTagLabels = computed(() => {
  const tagMap = new Map(
    (metaRef.value?.tag_groups || []).flatMap((group) =>
      (group.tags || []).map((tag: Record<string, any>) => [
        Number(tag.id),
        `${group.title} / ${tag.name}`,
      ]),
    ),
  );

  return (detail.value?.tagids || [])
    .map((item) => tagMap.get(Number(item.id)))
    .filter(Boolean) as string[];
});

const selectedInsuranceLabels = computed(() => {
  const insuranceMap = new Map(
    (metaRef.value?.project_list || []).map((item) => [
      Number(item.id),
      item.name,
    ]),
  );

  return (detail.value?.insuranceids || [])
    .map((id) => insuranceMap.get(Number(id)))
    .filter(Boolean) as string[];
});

const extraContentFields = computed<
  Array<{ content: string; key: LineExtraContentKey; label: string }>
>(() => {
  const lineConfig = metaRef.value?.line_config || {};
  const detailValue = detail.value;
  if (!detailValue) {
    return [];
  }

  const keys: LineExtraContentKey[] = [
    'content1',
    'content2',
    'content3',
    'content4',
    'content5',
  ];

  return keys
    .map((key) => ({
      content: detailValue[key] || '',
      key,
      label: String(lineConfig[key] || '').trim(),
    }))
    .filter((item) => item.label);
});

function formatDateTime(timestamp: number) {
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

function openExternal(url: string | undefined) {
  if (!url) {
    return;
  }
  window.open(url, '_blank');
}

async function loadDetail() {
  const id = Number(route.params.id || 0);
  if (!id) {
    ElMessage.error('线路参数错误');
    return;
  }

  loading.value = true;
  try {
    const [detailResponse, metaResponse] = await Promise.all([
      getLineDetailApi(id),
      getLineOptionsApi(),
    ]);
    detail.value = detailResponse.detail;
    suits.value = detailResponse.suits || [];
    metaRef.value = metaResponse;
  } catch (error) {
    console.error(error);
    ElMessage.error('线路详情加载失败，请稍后重试');
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

  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/line/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/line/suit/${route.params.id}`)">套餐管理</ElButton>
        <ElButton type="primary" plain @click="router.push(`/line/price/${route.params.id}`)">
          价格库存
        </ElButton>
        <ElButton type="primary" @click="router.push(`/line/edit/${route.params.id}`)">
          编辑线路
        </ElButton>
      </div>
    </template>

    <div v-loading="loading" class="grid gap-4">
      <AnalysisChartCard title="基础信息">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="线路标题">
            {{ detail?.title || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="线路类型">
            {{ detail?.type_text || detail?.type || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="行程天数">
            {{ detail ? `${detail.lineday}天${detail.linenight}晚` : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag
              :type="String(detail?.status) === '1' ? 'success' : 'info'"
              effect="light"
              round
            >
              {{ detail?.status_text || detail?.status || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审核状态">
            <ElTag
              :type="
                String(detail?.audit_status) === '1'
                  ? 'success'
                  : String(detail?.audit_status) === '2'
                    ? 'danger'
                    : 'warning'
              "
              effect="light"
              round
            >
              {{ detail?.audit_status_text || detail?.audit_status || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="联系电话">
            {{ detail?.mobile || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最低成团人数">
            {{ detail?.min_num || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="多人签约">
            {{ String(detail?.isMultiSignatory) === '1' ? '是' : '否' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="销量">
            {{ detail?.sales || 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ detail ? formatDateTime(detail.createtime) : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审核时间">
            {{ detail?.audit_time ? formatDateTime(detail.audit_time) : '-' }}
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
          v-if="String(detail?.audit_status) === '0'"
          class="mt-4 rounded-xl border border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)] px-4 py-3 text-sm text-muted-foreground"
        >
          当前线路内容待平台审核，审核通过后才会对外上架。套餐与价格库存可以继续维护，不受审核流程影响。
        </div>

        <div
          v-else-if="String(detail?.audit_status) === '2'"
          class="mt-4 rounded-xl border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-4 py-3 text-sm text-muted-foreground"
        >
          当前线路审核已被驳回，请根据驳回原因修改内容后重新提交。套餐与价格库存仍可继续维护。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="标签与附加项目">
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="space-y-3">
            <div class="text-sm font-medium">线路标签</div>
            <div
              v-if="selectedTagLabels.length > 0"
              class="flex flex-wrap gap-2"
            >
              <ElTag
                v-for="item in selectedTagLabels"
                :key="item"
                effect="plain"
                round
              >
                {{ item }}
              </ElTag>
            </div>
            <ElEmpty v-else description="暂无线路标签" :image-size="80" />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">保险产品</div>
            <div
              v-if="selectedInsuranceLabels.length > 0"
              class="flex flex-wrap gap-2"
            >
              <ElTag
                v-for="item in selectedInsuranceLabels"
                :key="item"
                effect="plain"
                round
                type="success"
              >
                {{ item }}
              </ElTag>
            </div>
            <ElEmpty v-else description="暂无附加保险产品" :image-size="80" />
          </div>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="线路简介">
        <div class="text-sm leading-7 text-muted-foreground">
          {{ detail?.desc || '暂无线路简介' }}
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="行程安排">
        <div v-if="detail?.dayinfo?.length" class="grid gap-3">
          <div
            v-for="(item, index) in detail?.dayinfo || []"
            :key="index"
            class="rounded-xl border p-4"
          >
            <div class="mb-3 text-base font-medium">
              第 {{ index + 1 }} 天 {{ item.name || '' }}
            </div>
            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
              <div>城市：{{ item.city || '-' }}</div>
              <div>用餐：{{ item.meals || '-' }}</div>
              <div>住宿：{{ item.stay || '-' }}</div>
              <div>交通：{{ item.travel || '-' }}</div>
            </div>
            <div class="mt-3 text-sm leading-6 text-muted-foreground">
              <VbenTiptapPreview
                v-if="item.content"
                :content="item.content"
                :min-height="120"
              />
              <div v-else>暂无行程内容</div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="rounded-xl border p-4 text-sm text-muted-foreground"
        >
          当前线路还没有配置行程安排。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="媒体资源">
        <div class="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <div class="space-y-2">
            <p class="text-sm font-medium">海报</p>
            <div class="overflow-hidden rounded-md border bg-muted/20">
              <ElImage
                v-if="detail?.poster"
                :preview-src-list="[detail.poster]"
                :src="detail.poster"
                class="line-poster-image w-full"
                fit="contain"
                preview-teleported
              />
              <div
                v-else
                class="flex h-[420px] items-center justify-center p-4 text-sm text-muted-foreground"
              >
                暂无海报
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">轮播图</p>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="item in detail?.images || []"
                :key="item"
                class="line-carousel-card overflow-hidden rounded-md border bg-muted/20"
              >
                <ElImage
                  :preview-src-list="detail?.images || []"
                  :src="item"
                  class="line-carousel-image h-full w-full"
                  fit="contain"
                  preview-teleported
                />
              </div>
              <div
                v-if="!(detail?.images && detail.images.length)"
                class="line-carousel-card flex items-center justify-center rounded-md border p-4 text-sm text-muted-foreground"
              >
                暂无轮播图
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border p-4">
            <div class="mb-2 text-sm font-medium">视频</div>
            <div v-if="detail?.video" class="flex items-center justify-between gap-3">
              <span class="truncate text-sm text-muted-foreground">
                {{ detail.video.split('/').pop() }}
              </span>
              <ElButton size="small" @click="openExternal(detail.video)">
                预览
              </ElButton>
            </div>
            <div v-else class="text-sm text-muted-foreground">暂无视频</div>
          </div>

          <div class="rounded-xl border p-4">
            <div class="mb-2 text-sm font-medium">行程文件</div>
            <div v-if="detail?.file" class="flex items-center justify-between gap-3">
              <span class="truncate text-sm text-muted-foreground">
                {{ detail.file.split('/').pop() }}
              </span>
              <ElButton size="small" @click="openExternal(detail.file)">
                下载
              </ElButton>
            </div>
            <div v-else class="text-sm text-muted-foreground">暂无文件</div>
          </div>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="线路详情">
        <div class="grid gap-4">
          <div class="space-y-2">
            <div class="text-sm font-medium">主详情内容</div>
            <VbenTiptapPreview
              :content="detail?.content || ''"
              :min-height="160"
            />
          </div>

          <div
            v-if="extraContentFields.length > 0"
            class="grid gap-4 lg:grid-cols-2"
          >
            <div
              v-for="field in extraContentFields"
              :key="field.key"
              class="space-y-2"
            >
              <div class="text-sm font-medium">{{ field.label }}</div>
              <VbenTiptapPreview
                :content="field.content"
                :min-height="140"
              />
            </div>
          </div>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="套餐概况">
        <div class="grid gap-3">
          <div
            v-for="suit in suits"
            :key="suit.id"
            class="rounded-xl border p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <strong class="text-base">{{ suit.name }}</strong>
              <ElTag effect="plain" round>
                原始价格 {{ suit.price || '-' }}
              </ElTag>
            </div>
            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
              <div>成人标准：{{ suit.person || '-' }}</div>
              <div>老人标准：{{ suit.oldperson || '-' }}</div>
              <div>儿童标准：{{ suit.child || '-' }}</div>
              <div>单房差：{{ suit.room || '-' }}</div>
            </div>
            <div class="mt-3 text-sm leading-6 text-muted-foreground">
              {{ suit.content || '暂无套餐说明' }}
            </div>
          </div>

          <div
            v-if="!suits.length"
            class="rounded-xl border p-4 text-sm text-muted-foreground"
          >
            当前线路还没有套餐数据。
          </div>
        </div>
      </AnalysisChartCard>
    </div>
  </Page>
</template>

<style scoped>
.line-poster-image {
  height: 420px;
}

.line-carousel-card {
  height: 180px;
  width: 280px;
}

.line-carousel-image {
  padding: 8px;
}

@media (max-width: 768px) {
  .line-poster-image {
    height: 320px;
  }

  .line-carousel-card {
    width: 100%;
  }
}
</style>
