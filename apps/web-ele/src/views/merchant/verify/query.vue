<script lang="ts" setup>
import type { MerchantVerifyDetail } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisChartCard, Page } from '@vben/common-ui';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTag,
} from 'element-plus';

import { getTicketVerifyDetailApi, useTicketVerifyApi } from '#/api';

import VerifyDetailContent from './modules/verify-detail-content.vue';

defineOptions({ name: 'MerchantVerifyQueryPage' });

const router = useRouter();

const keyword = ref('');
const loading = ref(false);
const usingVerify = ref(false);
const detail = ref<MerchantVerifyDetail | null>(null);
const hasSearched = ref(false);

const orderInfo = computed(() => detail.value?.order_info || null);

const verifyStatusTagType = computed(() => {
  return detail.value?.status === '1' ? 'success' : 'warning';
});

const resultTitle = computed(() => {
  return (
    orderInfo.value?.ticket_info?.title ||
    orderInfo.value?.ticket_info?.name ||
    orderInfo.value?.order_sn ||
    '核销详情'
  );
});

const resultSubtitle = computed(() => {
  if (!detail.value) {
    return '';
  }

  if (detail.value.status === '1') {
    return `该核销码已完成核销，核销时间：${detail.value.verifytime_text || '-'}`;
  }

  return '核销码有效，可直接执行核销。';
});

async function handleQuery() {
  const code = keyword.value.trim();
  if (!code) {
    ElMessage.warning('请输入核销码');
    return;
  }

  hasSearched.value = true;
  loading.value = true;
  try {
    const response = await getTicketVerifyDetailApi({ code });
    detail.value = response.detail;
  } catch (error) {
    console.error(error);
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  keyword.value = '';
  detail.value = null;
  hasSearched.value = false;
}

async function handleUseVerify() {
  if (!detail.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定核销核销码“${detail.value.code}”吗？`,
      '执行核销',
      {
        confirmButtonText: '确定核销',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  usingVerify.value = true;
  try {
    const response = await useTicketVerifyApi({ id: detail.value.id });
    detail.value = response.detail;
    ElMessage.success('核销成功');
  } catch (error) {
    console.error(error);
  } finally {
    usingVerify.value = false;
  }
}
</script>

<template>
  <Page
    auto-content-height
    description="支持输入或扫描门票核销码，快速核验当前商家的门票订单并完成核销。"
    title="核销查询"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/verify/records')">核销记录</ElButton>
      </div>
    </template>

    <div class="grid gap-4">
      <div class="verify-query-hero rounded-3xl border px-6 py-6">
        <div
          class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_560px] xl:items-stretch"
        >
          <div class="space-y-4">
            <div class="space-y-3">
              <div class="text-sm font-semibold text-primary">核销中心</div>
              <div class="text-2xl font-semibold text-foreground">
                输入或扫描核销码，快速完成核销
              </div>
              <div class="max-w-3xl text-sm leading-6 text-muted-foreground">
                支持扫码枪回车直接查询。核销详情、订单信息和游客信息会集中展示，避免在记录页和订单页之间来回切换。
              </div>
            </div>

            <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <div class="verify-query-chip rounded-full px-3 py-1.5">
                支持扫码枪回车
              </div>
              <div class="verify-query-chip rounded-full px-3 py-1.5">
                仅核销当前商家门票
              </div>
              <div class="verify-query-chip rounded-full px-3 py-1.5">
                重复核销自动拦截
              </div>
            </div>
          </div>

          <div class="verify-query-panel rounded-3xl p-6">
            <div class="flex h-full flex-col justify-between gap-5">
              <div class="space-y-2">
                <div class="text-base font-semibold">核销码输入区</div>
                <div class="text-xs text-muted-foreground">
                  扫码枪回车后可直接查询，也支持人工输入核销码。
                </div>
              </div>

              <div class="space-y-4">
                <ElInput
                  v-model="keyword"
                  class="verify-query-input"
                  clearable
                  placeholder="请输入或扫描核销码"
                  @keyup.enter="handleQuery"
                />

                <div class="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <ElButton size="large" @click="handleReset">清空</ElButton>
                  <ElButton
                    :loading="loading"
                    size="large"
                    type="primary"
                    @click="handleQuery"
                  >
                    查询核销码
                  </ElButton>
                </div>
              </div>

              <div
                class="rounded-2xl border bg-muted/20 px-4 py-3 text-xs text-muted-foreground"
              >
                建议将光标保持在输入框内，连续扫码后按回车，可快速完成多笔核销。
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="detail" class="grid gap-4">
        <div class="rounded-3xl border bg-card p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <div class="text-2xl font-semibold text-foreground">
                  {{ resultTitle }}
                </div>
                <ElTag
                  :type="verifyStatusTagType"
                  effect="light"
                  round
                  size="large"
                >
                  {{ detail.status_text || detail.status }}
                </ElTag>
              </div>

              <div class="text-sm text-muted-foreground">
                {{ resultSubtitle }}
              </div>

              <div class="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div class="verify-summary-card rounded-2xl px-4 py-3">
                  <div class="text-xs text-muted-foreground">核销码</div>
                  <div class="mt-1 font-medium">{{ detail.code || '-' }}</div>
                </div>
                <div class="verify-summary-card rounded-2xl px-4 py-3">
                  <div class="text-xs text-muted-foreground">联系人</div>
                  <div class="mt-1 font-medium">
                    {{ orderInfo?.realname || '-' }}
                  </div>
                </div>
                <div class="verify-summary-card rounded-2xl px-4 py-3">
                  <div class="text-xs text-muted-foreground">出游日期</div>
                  <div class="mt-1 font-medium">
                    {{ orderInfo?.date || '-' }}
                  </div>
                </div>
                <div class="verify-summary-card rounded-2xl px-4 py-3">
                  <div class="text-xs text-muted-foreground">数量 / 金额</div>
                  <div class="mt-1 font-medium">
                    {{ orderInfo?.number ?? '-' }} /
                    {{ orderInfo?.total_fee || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <ElButton size="large" @click="router.push('/verify/records')">
                查看记录
              </ElButton>
              <ElButton
                v-if="detail.status === '0'"
                :loading="usingVerify"
                size="large"
                type="primary"
                @click="handleUseVerify"
              >
                执行核销
              </ElButton>
            </div>
          </div>
        </div>

        <VerifyDetailContent :detail="detail" />
      </div>

      <AnalysisChartCard v-else-if="hasSearched && !loading" title="查询结果">
        <ElEmpty
          description="没有查询到可核销的记录，请检查核销码是否正确。"
          :image-size="90"
        />
      </AnalysisChartCard>

      <AnalysisChartCard v-else-if="!loading" title="使用说明">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="verify-guide-card rounded-2xl px-4 py-4">
            <div class="text-sm font-medium">1. 输入或扫码</div>
            <div class="mt-2 text-xs leading-6 text-muted-foreground">
              输入核销码，或使用扫码枪直接扫描后回车。
            </div>
          </div>
          <div class="verify-guide-card rounded-2xl px-4 py-4">
            <div class="text-sm font-medium">2. 确认信息</div>
            <div class="mt-2 text-xs leading-6 text-muted-foreground">
              核对联系人、出游日期、金额和游客信息是否一致。
            </div>
          </div>
          <div class="verify-guide-card rounded-2xl px-4 py-4">
            <div class="text-sm font-medium">3. 执行核销</div>
            <div class="mt-2 text-xs leading-6 text-muted-foreground">
              仅对待核销记录执行核销，已核销记录会自动拦截。
            </div>
          </div>
        </div>
      </AnalysisChartCard>
    </div>
  </Page>
</template>

<style scoped>
.verify-query-hero {
  background:
    radial-gradient(
      circle at top right,
      rgb(64 158 255 / 10%),
      transparent 28%
    ),
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)));
}

.verify-query-panel {
  min-width: min(100%, 520px);
  min-height: 248px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 12px 28px rgb(15 23 42 / 6%);
}

.verify-query-input :deep(.el-input__wrapper) {
  min-height: 60px;
}

.verify-query-input :deep(.el-input__inner) {
  font-size: 16px;
}

.verify-query-chip {
  background: hsl(var(--muted));
}

.verify-summary-card {
  background: hsl(var(--muted) / 50%);
  border: 1px solid hsl(var(--border));
}

.verify-guide-card {
  background: hsl(var(--muted) / 40%);
  border: 1px solid hsl(var(--border));
}
</style>
