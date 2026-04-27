<script lang="ts" setup>
import type {
  MerchantGoodsOrderDetail,
  MerchantGoodsOrderDetailItem,
  MerchantGoodsOrderExpressItem,
} from '#/api';

import { computed } from 'vue';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatOrderDateTime,
  getOrderStatusTagType,
  getProcessStatusTagType,
} from '../helper';
import OrderUserPanel from './order-user-panel.vue';

const props = defineProps<{
  detail: MerchantGoodsOrderDetail | null;
}>();

function getReceiverName(detail: MerchantGoodsOrderDetail | null) {
  return detail?.consignee || '-';
}

function getReceiverMobile(detail: MerchantGoodsOrderDetail | null) {
  return detail?.mobile || '-';
}

function getReceiverAddress(detail: MerchantGoodsOrderDetail | null) {
  if (!detail) {
    return '-';
  }

  const directAddress = [
    detail.province_name,
    detail.city_name,
    detail.district_name,
    detail.address,
  ]
    .filter(Boolean)
    .join(' ');

  return directAddress || '-';
}

function getGoodsItemTitle(item: MerchantGoodsOrderDetailItem) {
  return item.goods_title || '-';
}

function getGoodsItemSpec(item: MerchantGoodsOrderDetailItem) {
  return item.goods_sku_text || '-';
}

function getGoodsItemNumber(item: MerchantGoodsOrderDetailItem) {
  return item.goods_num ?? '-';
}

function getGoodsItemPayPrice(item: MerchantGoodsOrderDetailItem) {
  return item.pay_price || '-';
}

function getExpressCompany(item: MerchantGoodsOrderExpressItem) {
  return item.express_name || '-';
}

function getExpressCode(item: MerchantGoodsOrderExpressItem) {
  return item.express_code || '-';
}

function getExpressNo(item: MerchantGoodsOrderExpressItem) {
  return item.express_no || '-';
}

const orderItems = computed(() => props.detail?.items || []);
const expressItems = computed(() => props.detail?.express || []);
</script>

<template>
  <div v-if="detail" class="grid min-w-0 gap-4 overflow-x-hidden">
    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-base font-medium">订单信息</div>
        <ElTag :type="getOrderStatusTagType(detail.status)" effect="light" round>
          {{ detail.status_text || detail.status || '-' }}
        </ElTag>
        <ElTag
          v-if="detail.type_text || detail.type"
          effect="plain"
          round
          type="info"
        >
          {{ detail.type_text || detail.type }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="订单号">
          {{ detail.order_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单类型">
          {{ detail.type_text || detail.type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收货人">
          {{ getReceiverName(detail) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ getReceiverMobile(detail) }}
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
        <ElDescriptionsItem label="发货时间">
          {{ formatOrderDateTime(detail.sendtime || 0) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间">
          {{ formatOrderDateTime(detail.finishtime || 0) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="交易单号">
          {{ detail.transaction_id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="收货地址">
          {{ getReceiverAddress(detail) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="备注">
          {{ detail.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <OrderUserPanel title="下单用户" :user-info="detail.user_info" />

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">费用信息</div>
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="商品金额">
          {{ detail.goods_amount || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="运费">
          {{ detail.dispatch_amount || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单总金额">
          {{ detail.total_amount || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单应付金额">
          {{ detail.total_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实付金额">
          {{ detail.pay_fee || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">商品明细</div>

      <ElTable v-if="orderItems.length > 0" :data="orderItems" border>
        <ElTableColumn label="商品信息" min-width="220">
          <template #default="{ row }">
            <div class="min-w-0 space-y-1">
              <div class="truncate font-medium text-foreground">
                {{ getGoodsItemTitle(row) }}
              </div>
              <div class="truncate text-xs text-muted-foreground">
                规格：{{ getGoodsItemSpec(row) }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="单价" min-width="88">
          <template #default="{ row }">
            {{ row.goods_price || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="数量" min-width="72">
          <template #default="{ row }">
            {{ getGoodsItemNumber(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="商品实付" min-width="92">
          <template #default="{ row }">
            {{ getGoodsItemPayPrice(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="分摊运费" min-width="92">
          <template #default="{ row }">
            {{ row.dispatch_fee || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="发货状态" min-width="108">
          <template #default="{ row }">
            <ElTag
              :type="
                getProcessStatusTagType(
                  row.dispatch_status,
                  row.dispatch_status_text,
                )
              "
              effect="light"
              round
            >
              {{ row.dispatch_status_text || row.dispatch_status || '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="售后状态" min-width="108">
          <template #default="{ row }">
            <ElTag
              :type="
                getProcessStatusTagType(
                  row.aftersale_status,
                  row.aftersale_status_text,
                )
              "
              effect="light"
              round
            >
              {{ row.aftersale_status_text || row.aftersale_status || '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="退款状态" min-width="108">
          <template #default="{ row }">
            <ElTag
              :type="
                getProcessStatusTagType(
                  row.refund_status,
                  row.refund_status_text,
                )
              "
              effect="light"
              round
            >
              {{ row.refund_status_text || row.refund_status || '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="已退款金额" min-width="96">
          <template #default="{ row }">
            {{ row.refund_fee || '-' }}
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前没有商品明细" :image-size="80" />
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">发货记录</div>

      <ElTable v-if="expressItems.length > 0" :data="expressItems" border>
        <ElTableColumn label="物流公司" min-width="140">
          <template #default="{ row }">
            {{ getExpressCompany(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="公司编码" min-width="120">
          <template #default="{ row }">
            {{ getExpressCode(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="物流单号" min-width="180">
          <template #default="{ row }">
            {{ getExpressNo(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatOrderDateTime(row.createtime || 0) }}
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前没有发货记录" :image-size="80" />
    </div>
  </div>
</template>
