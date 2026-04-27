<script lang="ts" setup>
import type {
  MerchantTicketDetail,
  MerchantTicketMetaResult,
  MerchantTicketSuitItem,
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

import { getTicketDetailApi, getTicketOptionsApi } from '#/api';

defineOptions({ name: 'MerchantTicketDetailPage' });

interface TicketTreeOption {
  children?: TicketTreeOption[];
  id: number | string;
  name: string;
}

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<MerchantTicketDetail | null>(null);
const suits = ref<MerchantTicketSuitItem[]>([]);
const metaRef = ref<MerchantTicketMetaResult | null>(null);

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

function flattenTreeOptions(items: TicketTreeOption[] = []) {
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
    (metaRef.value?.category_options || []) as TicketTreeOption[],
  );
  return (detail.value?.category_ids || [])
    .map((id) => categoryMap.get(Number(id)))
    .filter(Boolean) as string[];
});

const endCityLabels = computed(() => {
  return (detail.value?.endcity || [])
    .map((item) => String(item.name || ''))
    .filter(Boolean);
});

const extraContents = computed(() => {
  const current = detail.value;
  if (!current) {
    return [];
  }

  const ticketConfig = metaRef.value?.ticket_config || {};

  return [
    {
      content: current.content1,
      label: String(ticketConfig.content1 || '').trim(),
    },
    {
      content: current.content2,
      label: String(ticketConfig.content2 || '').trim(),
    },
    {
      content: current.content3,
      label: String(ticketConfig.content3 || '').trim(),
    },
    {
      content: current.content4,
      label: String(ticketConfig.content4 || '').trim(),
    },
    {
      content: current.content5,
      label: String(ticketConfig.content5 || '').trim(),
    },
  ].filter((item) => item.label && item.content);
});

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

function getSuitAuditTagType(status: string) {
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

function openExternal(url: string | undefined) {
  if (!url) {
    return;
  }

  window.open(url, '_blank');
}

async function loadDetail() {
  const id = Number(route.params.id || 0);
  if (!id) {
    ElMessage.error('门票参数错误');
    return;
  }

  loading.value = true;
  try {
    const [detailResponse, metaResponse] = await Promise.all([
      getTicketDetailApi(id),
      getTicketOptionsApi(),
    ]);
    detail.value = detailResponse.detail;
    suits.value = detailResponse.merchant_suits || [];
    metaRef.value = metaResponse;
  } catch (error) {
    console.error(error);
    ElMessage.error('门票详情加载失败，请稍后重试');
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
    description="景点基础资料由平台统一维护，商家端在这里查看景点信息，并继续维护自己的门票套餐与价格库存。"
    title="门票详情"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/ticket/list')">返回列表</ElButton>
        <ElButton @click="router.push(`/ticket/suit/${route.params.id}`)">套餐管理</ElButton>
        <ElButton type="primary" plain @click="router.push(`/ticket/price/${route.params.id}`)">
          价格库存
        </ElButton>
      </div>
    </template>

    <div v-loading="loading" class="grid gap-4">
      <AnalysisChartCard title="基础信息">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="景点名称">
            {{ detail?.title || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="景点状态">
            <ElTag
              :type="detail?.status === 'normal' ? 'success' : 'info'"
              effect="light"
              round
            >
              {{ detail?.status_text || detail?.status || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="开放时间">
            {{ detail?.opentime || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="景点等级">
            {{ detail?.level_text || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="景点卖点" :span="2">
            {{ detail?.sellpoint || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="详细地址" :span="2">
            {{ detail?.address || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="联系电话">
            {{ detail?.mobile || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="坐标">
            {{ detail?.lat || '-' }} / {{ detail?.lng || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ detail ? formatDateTime(detail.createtime) : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ detail ? formatDateTime(detail.updatetime) : '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mt-4 rounded-xl border border-[var(--el-color-primary-light-5)] bg-[var(--el-color-primary-light-9)] px-4 py-3 text-sm text-muted-foreground">
          当前景点主表信息由平台维护。商家端不直接修改景点基础资料，只维护自己的门票套餐与价格库存。
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="标签与分类">
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="space-y-3">
            <div class="text-sm font-medium">景点标签</div>
            <div v-if="detail?.tags?.length" class="flex flex-wrap gap-2">
              <ElTag v-for="item in detail.tags" :key="item" effect="plain" round>
                {{ item }}
              </ElTag>
            </div>
            <ElEmpty v-else description="暂无景点标签" :image-size="80" />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">景点分类</div>
            <div v-if="categoryLabels.length" class="flex flex-wrap gap-2">
              <ElTag v-for="item in categoryLabels" :key="item" effect="plain" round type="success">
                {{ item }}
              </ElTag>
            </div>
            <ElEmpty v-else description="暂无分类信息" :image-size="80" />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">目的地</div>
            <div v-if="endCityLabels.length" class="flex flex-wrap gap-2">
              <ElTag v-for="item in endCityLabels" :key="item" effect="plain" round type="warning">
                {{ item }}
              </ElTag>
            </div>
            <ElEmpty v-else description="暂无目的地信息" :image-size="80" />
          </div>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="景点简介">
        <div class="text-sm leading-7 text-muted-foreground">
          {{ detail?.desc || '暂无景点简介' }}
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard title="媒体资源">
        <div class="grid gap-4">
          <div class="space-y-2">
            <div class="text-sm font-medium">轮播图</div>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="item in detail?.images || []"
                :key="item"
                class="ticket-carousel-card overflow-hidden rounded-md border bg-muted/20"
              >
                <ElImage
                  :preview-src-list="detail?.images || []"
                  :src="item"
                  class="ticket-carousel-image h-full w-full"
                  fit="contain"
                  preview-teleported
                />
              </div>
              <div
                v-if="!(detail?.images && detail.images.length)"
                class="ticket-carousel-card flex items-center justify-center rounded-md border p-4 text-sm text-muted-foreground"
              >
                暂无轮播图
              </div>
            </div>
          </div>

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
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard v-if="extraContents.length > 0" title="补充内容">
        <div class="grid gap-4 lg:grid-cols-2">
          <div
            v-for="item in extraContents"
            :key="item.label"
            class="space-y-2"
          >
            <div class="text-sm font-medium">{{ item.label }}</div>
            <VbenTiptapPreview :content="item.content" :min-height="140" />
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
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <strong class="text-base">{{ suit.name }}</strong>
              <div class="flex flex-wrap gap-2">
                <ElTag :type="getSuitAuditTagType(suit.audit_status)" effect="light" round>
                  {{ suit.audit_status_text || suit.audit_status || '-' }}
                </ElTag>
                <ElTag effect="plain" round>
                  原始价格 {{ suit.price || '-' }}
                </ElTag>
              </div>
            </div>

            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
              <div>门票类型：{{ getTypeName(suit.type_id) }}</div>
              <div>提前预订：{{ suit.before || 0 }} 天</div>
              <div>当天截止：{{ suit.beforetime || '-' }}</div>
              <div>游客信息：{{ getPassengerText(suit.passenger) }}</div>
            </div>

            <div v-if="suit.tags?.length" class="mt-3 flex flex-wrap gap-2">
              <ElTag v-for="item in suit.tags" :key="item" effect="plain" round type="info">
                {{ item }}
              </ElTag>
            </div>

            <div class="mt-3 text-sm text-muted-foreground">
              取票说明：{{ suit.explain || '-' }}
            </div>

            <div class="mt-3 text-sm leading-6 text-muted-foreground">
              <VbenTiptapPreview
                v-if="suit.content"
                :content="suit.content"
                :min-height="120"
              />
              <div v-else>暂无套餐介绍</div>
            </div>

            <div
              v-if="suit.audit_status === '2' && suit.audit_remark"
              class="mt-3 rounded-lg border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-3 py-2 text-sm text-muted-foreground"
            >
              驳回原因：{{ suit.audit_remark }}
            </div>
          </div>

          <div
            v-if="!suits.length"
            class="rounded-xl border p-4 text-sm text-muted-foreground"
          >
            当前景点还没有可经营的门票套餐。
          </div>
        </div>
      </AnalysisChartCard>
    </div>
  </Page>
</template>

<style scoped>
.ticket-carousel-card {
  height: 180px;
  width: 280px;
}

.ticket-carousel-image {
  padding: 8px;
}

@media (max-width: 768px) {
  .ticket-carousel-card {
    width: 100%;
  }
}
</style>
