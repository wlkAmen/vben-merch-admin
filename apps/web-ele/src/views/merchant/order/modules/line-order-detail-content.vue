<script lang="ts" setup>
import type { MerchantLineOrderDetail } from '#/api';

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

import { formatOrderDateTime, getOrderStatusTagType } from '../helper';
import OrderUserPanel from './order-user-panel.vue';

const props = defineProps<{
  detail: MerchantLineOrderDetail | null;
}>();

const lineTitle = computed(() => {
  return props.detail?.line_info?.title || '-';
});

const suitTitle = computed(() => {
  return props.detail?.suit_info?.name || '-';
});

const passengers = computed(() => props.detail?.passengers || []);
const projectOrders = computed(() => props.detail?.project_orders || []);
const bxInfo = computed(() => props.detail?.bx_info || []);
const siteInfo = computed(() => props.detail?.site_json || null);

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
        <ElTag
          :type="getOrderStatusTagType(detail.status)"
          effect="light"
          round
        >
          {{ detail.status_text || detail.status }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="订单号">
          {{ detail.order_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="线路">
          {{ lineTitle }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="套餐">
          {{ suitTitle }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="线路 ID">
          {{ detail.line_info?.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="套餐 ID">
          {{ detail.suit_info?.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出游日期">
          {{ detail.date || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">
          {{ detail.realname || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ detail.mobile || '-' }}
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
      <div class="mb-3 text-base font-medium">费用拆分</div>
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="成人人数 / 单价">
          {{ detail.adult_num }} / {{ detail.adult_price || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="老人人数 / 单价">
          {{ detail.elder_num }} / {{ detail.elder_price || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="儿童人数 / 单价">
          {{ detail.child_num }} / {{ detail.child_price || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="单房数 / 单价">
          {{ detail.room_num }} / {{ detail.room_price || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="单房费">
          {{ detail.room_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="必消费用">
          {{ detail.bx_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="保险费用">
          {{ detail.project_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单金额">
          {{ detail.total_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实付金额">
          {{ detail.pay_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款金额">
          {{ detail.refund_fee || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">旅客信息</div>

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

      <ElEmpty v-else description="当前没有旅客信息" :image-size="80" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">必消项目</div>

        <ElTable v-if="bxInfo.length > 0" :data="bxInfo" border>
          <ElTableColumn label="名称" min-width="140">
            <template #default="{ row }">
              {{ row.name || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="金额" min-width="120">
            <template #default="{ row }">
              {{ row.price || row.amount || '-' }}
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-else description="当前没有必消项目" :image-size="80" />
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">保险订单</div>

        <ElTable v-if="projectOrders.length > 0" :data="projectOrders" border>
          <ElTableColumn label="订单号" min-width="160" prop="order_sn" />
          <ElTableColumn label="保险名称" min-width="140" prop="project_name" />
          <ElTableColumn label="保险单价" min-width="100" prop="project_price" />
          <ElTableColumn label="订单金额" min-width="100" prop="total_fee" />
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              {{ row.status_text || row.status || '-' }}
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-else description="当前没有保险订单" :image-size="80" />
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">上车点信息</div>
        <ElDescriptions v-if="siteInfo" :column="1" border>
          <ElDescriptionsItem label="上车点 ID">
            {{ siteInfo.id || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上车点名称">
            {{ siteInfo.name || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElEmpty v-else description="当前没有上车点信息" :image-size="80" />
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">退款信息</div>
        <ElDescriptions v-if="detail.refund" :column="1" border>
          <ElDescriptionsItem label="退款单号">
            {{ detail.refund.refund_sn || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="退款状态">
            {{ detail.refund.status_text || detail.refund.status || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="售后状态">
            {{ detail.refund.refund_status_text || detail.refund.refund_status || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="退款类型">
            {{ detail.refund.type_text || detail.refund.type || '-' }}
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
  </div>
</template>
