<script lang="ts" setup>
import type { MerchantTicketOrderDetail } from '#/api';

import { computed } from 'vue';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElImage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatOrderDateTime,
  getOrderStatusTagType,
  getVerifyStatusTagType,
} from '../helper';
import OrderUserPanel from './order-user-panel.vue';

const props = defineProps<{
  detail: MerchantTicketOrderDetail | null;
}>();

const ticketInfo = computed(() => props.detail?.ticket_info || null);
const suitInfo = computed(() => props.detail?.suit_info || null);
const passengers = computed(() => props.detail?.passengers || []);
const verifyInfo = computed(() => props.detail?.verify_info || null);

function getPassengerGenderText(gender?: number) {
  if (gender === 1) {
    return '男';
  }

  if (gender === 0) {
    return '女';
  }

  return '-';
}

function getPassengerIdTypeText(idtype?: number) {
  if (idtype === undefined || idtype === null) {
    return '-';
  }

  return String(idtype);
}
</script>

<template>
  <div v-if="detail" class="grid gap-4">
    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-base font-medium">订单信息</div>
        <ElTag :type="getOrderStatusTagType(detail.status)" effect="light" round>
          {{ detail.status_text || detail.status }}
        </ElTag>
        <ElTag
          v-if="verifyInfo"
          :type="getVerifyStatusTagType(verifyInfo.status)"
          effect="plain"
          round
        >
          核销：{{ verifyInfo.status_text || verifyInfo.status || '-' }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="订单号">
          {{ detail.order_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出游日期">
          {{ detail.date || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="景点">
          {{ ticketInfo?.title || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="景点 ID">
          {{ ticketInfo?.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="套餐">
          {{ suitInfo?.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="套餐 ID">
          {{ suitInfo?.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">
          {{ detail.realname || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ detail.mobile || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="数量">
          {{ detail.number ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="单价">
          {{ detail.price || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付方式">
          {{ detail.pay_type_text || detail.pay_type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="平台来源">
          {{ detail.platform_text || detail.platform || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="下单时间">
          {{ formatOrderDateTime(detail.createtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付时间">
          {{ formatOrderDateTime(detail.paytime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间">
          {{ formatOrderDateTime(detail.finishtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="交易单号" :span="2">
          {{ detail.transaction_id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付凭证" :span="2">
          <ElImage
            v-if="detail.pay_cert"
            :preview-src-list="[detail.pay_cert]"
            :src="detail.pay_cert"
            class="h-20 w-20 overflow-hidden rounded-md border"
            fit="cover"
            preview-teleported
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注" :span="2">
          {{ detail.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <OrderUserPanel title="下单用户" :user-info="detail.user_info" />

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">费用信息</div>
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="订单总金额">
          {{ detail.total_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实付金额">
          {{ detail.pay_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="已退款金额">
          {{ detail.refund_fee || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">核销信息</div>

      <ElDescriptions v-if="verifyInfo" :column="2" border>
        <ElDescriptionsItem label="核销记录 ID">
          {{ verifyInfo.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销码">
          {{ verifyInfo.code || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销状态">
          <ElTag
            :type="getVerifyStatusTagType(verifyInfo.status)"
            effect="light"
            round
          >
            {{ verifyInfo.status_text || verifyInfo.status || '-' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销时间">
          {{ formatOrderDateTime(verifyInfo.verifytime || 0) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商家 ID">
          {{ verifyInfo.merch_id ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="核销员 ID">
          {{ verifyInfo.saler_id ?? '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElEmpty v-else description="当前没有核销信息" :image-size="80" />
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">出游人信息</div>

      <ElTable v-if="passengers.length > 0" :data="passengers" border>
        <ElTableColumn label="姓名" min-width="120">
          <template #default="{ row }">
            {{ row.realname || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="手机号" min-width="140">
          <template #default="{ row }">
            {{ row.mobile || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="性别" min-width="90">
          <template #default="{ row }">
            {{ getPassengerGenderText(row.gender) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="证件类型" min-width="100">
          <template #default="{ row }">
            {{ getPassengerIdTypeText(row.idtype) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="证件号" min-width="180">
          <template #default="{ row }">
            {{ row.idcard || '-' }}
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前没有出游人信息" :image-size="80" />
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">退款信息</div>
      <ElDescriptions v-if="detail.refund" :column="1" border>
        <ElDescriptionsItem label="退款单号">
          {{ detail.refund.refund_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款类型">
          {{ detail.refund.type_text || detail.refund.type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款处理状态">
          {{ detail.refund.status_text || detail.refund.status || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="售后申请状态">
          {{ detail.refund.refund_status_text || detail.refund.refund_status || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款金额">
          {{ detail.refund.refund_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请时间">
          {{ formatOrderDateTime(detail.refund.createtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间">
          {{ formatOrderDateTime(detail.refund.finishtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款原因">
          {{ detail.refund.reason || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElEmpty v-else description="当前没有退款信息" :image-size="80" />
    </div>
  </div>
</template>
