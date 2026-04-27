<script lang="ts" setup>
import type { MerchantRefundDetail } from '#/api';

import { computed } from 'vue';

import {
  ElAvatar,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElImage,
  ElTag,
} from 'element-plus';

import {
  formatOrderDateTime,
  getProcessStatusTagType,
} from '../helper';

const props = defineProps<{
  detail: MerchantRefundDetail | null;
}>();

const paymentJsonText = computed(() => {
  const paymentJson = props.detail?.payment_json;

  if (!paymentJson) {
    return '';
  }

  if (typeof paymentJson === 'string') {
    return paymentJson;
  }

  return JSON.stringify(paymentJson, null, 2);
});

function getRefundTypeTagType(type?: string) {
  switch (type) {
    case 'goods': {
      return 'success';
    }
    case 'line': {
      return 'primary';
    }
    case 'ticket': {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
}
</script>

<template>
  <div v-if="detail" class="grid gap-4">
    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-base font-medium">退款信息</div>
        <ElTag :type="getRefundTypeTagType(detail.type)" effect="plain" round>
          {{ detail.type_text || detail.type || '-' }}
        </ElTag>
        <ElTag
          :type="
            getProcessStatusTagType(
              detail.refund_status,
              detail.refund_status_text,
            )
          "
          effect="light"
          round
        >
          {{ detail.refund_status_text || detail.refund_status || '-' }}
        </ElTag>
        <ElTag
          :type="getProcessStatusTagType(detail.status, detail.status_text)"
          effect="light"
          round
        >
          {{ detail.status_text || detail.status || '-' }}
        </ElTag>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="退款单号">
          {{ detail.refund_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="原订单号">
          {{ detail.order_sn || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单类型">
          {{ detail.type_text || detail.type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商品退款明细 ID">
          {{ detail.order_item_id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="原支付金额">
          {{ detail.pay_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款金额">
          {{ detail.refund_fee || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="原支付方式">
          {{ detail.pay_type_text || detail.pay_type || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请用户 ID">
          {{ detail.user_id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请时间">
          {{ formatOrderDateTime(detail.createtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间">
          {{ formatOrderDateTime(detail.finishtime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">
          {{ formatOrderDateTime(detail.updatetime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用户备注" :span="2">
          {{ detail.remark || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商家处理说明" :span="2">
          {{ detail.sys_msg || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">用户信息</div>

        <div class="mb-4 flex items-center gap-3">
          <ElAvatar
            v-if="detail.user_info?.avatar"
            :size="52"
            :src="detail.user_info.avatar"
          />
          <div class="space-y-1">
            <div class="font-medium text-foreground">
              {{ detail.user_info?.nickname || detail.user_info?.username || '-' }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ detail.user_info?.mobile || '-' }}
            </div>
          </div>
        </div>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="用户 ID">
            {{ detail.user_info?.id || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="用户名">
            {{ detail.user_info?.username || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="昵称">
            {{ detail.user_info?.nickname || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机号">
            {{ detail.user_info?.mobile || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-base font-medium">关联订单</div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="订单号">
            {{ detail.order_info?.order_sn || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="订单状态">
            {{ detail.order_info?.status_text || detail.order_info?.status || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="支付方式">
            {{ detail.order_info?.pay_type_text || detail.order_info?.pay_type || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="平台来源">
            {{ detail.order_info?.platform_text || detail.order_info?.platform || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type !== 'goods'" label="出游/游玩日期">
            {{ detail.order_info?.date || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type !== 'goods'" label="联系人">
            {{ detail.order_info?.realname || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type !== 'goods'" label="手机号">
            {{ detail.order_info?.mobile || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type === 'ticket'" label="数量">
            {{ detail.order_info?.number ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type === 'goods'" label="收货人">
            {{ detail.order_info?.consignee || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type === 'goods'" label="手机号">
            {{ detail.order_info?.mobile || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type === 'goods'" label="商品金额">
            {{ detail.order_info?.goods_amount || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detail.type === 'goods'" label="运费金额">
            {{ detail.order_info?.dispatch_amount || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="订单总金额">
            {{ detail.order_info?.total_fee || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实付金额">
            {{ detail.order_info?.pay_fee || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="已退款金额">
            {{ detail.order_info?.refund_fee || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="2" label="订单备注">
            {{ detail.order_info?.remark || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">关联资源</div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem v-if="detail.line_info" label="线路">
          {{ detail.line_info.title || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.line_info" label="线路 ID">
          {{ detail.line_info.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.ticket_info" label="景点">
          {{ detail.ticket_info.title || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.ticket_info" label="景点 ID">
          {{ detail.ticket_info.id || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.suit_info" label="套餐">
          {{ detail.suit_info.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.suit_info" label="套餐 ID">
          {{ detail.suit_info.id || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <div v-if="detail.goods_item" class="mt-4 rounded-2xl border p-4">
        <div class="mb-3 text-sm font-medium">商品退款明细</div>
        <div class="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
          <div>
            <ElImage
              v-if="detail.goods_item.goods_image"
              :preview-src-list="[detail.goods_item.goods_image]"
              :src="detail.goods_item.goods_image"
              class="h-20 w-20 overflow-hidden rounded-md border"
              fit="cover"
              preview-teleported
            />
          </div>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="商品标题">
              {{ detail.goods_item.goods_title || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="商品 ID">
              {{ detail.goods_item.goods_id || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="规格文案">
              {{ detail.goods_item.goods_sku_text || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="数量">
              {{ detail.goods_item.goods_num ?? '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="商品单价">
              {{ detail.goods_item.goods_price || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="商品实付">
              {{ detail.goods_item.pay_price || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="分摊运费">
              {{ detail.goods_item.dispatch_fee || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="已退款金额">
              {{ detail.goods_item.refund_fee || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="发货状态">
              <ElTag
                :type="
                  getProcessStatusTagType(
                    detail.goods_item.dispatch_status,
                    detail.goods_item.dispatch_status_text,
                  )
                "
                effect="light"
                round
              >
                {{ detail.goods_item.dispatch_status_text || detail.goods_item.dispatch_status || '-' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="售后状态">
              <ElTag
                :type="
                  getProcessStatusTagType(
                    detail.goods_item.aftersale_status,
                    detail.goods_item.aftersale_status_text,
                  )
                "
                effect="light"
                round
              >
                {{ detail.goods_item.aftersale_status_text || detail.goods_item.aftersale_status || '-' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="退款状态">
              <ElTag
                :type="
                  getProcessStatusTagType(
                    detail.goods_item.refund_status,
                    detail.goods_item.refund_status_text,
                  )
                "
                effect="light"
                round
              >
                {{ detail.goods_item.refund_status_text || detail.goods_item.refund_status || '-' }}
              </ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border bg-card p-4 shadow-sm">
      <div class="mb-3 text-base font-medium">退款原始数据</div>
      <pre
        v-if="paymentJsonText"
        class="overflow-x-auto rounded-xl bg-muted/30 p-3 text-xs leading-6 text-muted-foreground"
      >{{ paymentJsonText }}</pre>
      <ElEmpty v-else description="当前没有退款原始数据" :image-size="80" />
    </div>
  </div>
</template>
