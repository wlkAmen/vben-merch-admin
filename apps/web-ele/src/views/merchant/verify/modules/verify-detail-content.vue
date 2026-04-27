<script lang="ts" setup>
import type { MerchantVerifyDetail } from '#/api';

import { computed } from 'vue';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

const props = defineProps<{
  detail: MerchantVerifyDetail | null;
}>();

const orderInfo = computed(() => props.detail?.order_info || null);

const ticketTitle = computed(() => {
  const ticketInfo = orderInfo.value?.ticket_info || {};
  return (
    ticketInfo.title ||
    ticketInfo.name ||
    ticketInfo.id ||
    '-'
  );
});

const suitTitle = computed(() => {
  const suitInfo = orderInfo.value?.suit_info || {};
  return suitInfo.name || suitInfo.title || suitInfo.id || '-';
});

const passengers = computed(() => orderInfo.value?.passengers || []);
</script>

<template>
  <div v-if="detail" class="grid gap-4">
    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-base font-medium">核销信息</div>
        <ElTag
          :type="detail.status === '1' ? 'success' : 'warning'"
          effect="light"
          round
        >
          {{ detail.status_text || detail.status }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="核销码">
          {{ detail.code || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销状态">
          {{ detail.status_text || detail.status || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发放时间">
          {{ detail.createtime_text || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销时间">
          {{ detail.verifytime_text || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">订单信息</div>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="订单号">
          {{ orderInfo?.order_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单状态">
          {{ orderInfo?.status_text || orderInfo?.status || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">
          {{ orderInfo?.realname || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ orderInfo?.mobile || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出游日期">
          {{ orderInfo?.date || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="数量">
          {{ orderInfo?.number ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付方式">
          {{ orderInfo?.pay_type_text || orderInfo?.pay_type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="平台来源">
          {{ orderInfo?.platform_text || orderInfo?.platform || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="景点">
          {{ ticketTitle }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="套餐">
          {{ suitTitle }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单金额">
          {{ orderInfo?.total_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实付金额">
          {{ orderInfo?.pay_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="备注">
          {{ orderInfo?.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">游客信息</div>

      <ElTable v-if="passengers.length > 0" :data="passengers" border>
        <ElTableColumn label="姓名" min-width="120">
          <template #default="{ row }">
            {{ row.realname || row.name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="手机号" min-width="140">
          <template #default="{ row }">
            {{ row.mobile || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="证件号" min-width="180">
          <template #default="{ row }">
            {{ row.idcard || row.id_no || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="类型" min-width="100">
          <template #default="{ row }">
            {{ row.type || row.passenger_type || '-' }}
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前没有游客信息" :image-size="80" />
    </div>
  </div>
</template>
