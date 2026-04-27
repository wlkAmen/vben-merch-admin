<script lang="ts" setup>
import type { MerchantTicketOrderDetail } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton } from 'element-plus';

import { getTicketOrderDetailApi } from '#/api';

import OrderPayModal from './order-pay-modal.vue';
import TicketOrderDetailContent from './ticket-order-detail-content.vue';

defineOptions({ name: 'MerchantTicketOrderDetailModal' });

const emit = defineEmits<{
  success: [];
}>();

const currentDetail = ref<MerchantTicketOrderDetail | null>(null);
const detailLoading = ref(false);

const verifyHint = computed(() => {
  if (!currentDetail.value?.verify_info) {
    return '当前订单暂无核销信息，可在详情里继续确认游客和支付信息。';
  }

  return '门票核销属于高频操作，订单详情仅做查看；执行核销请前往核销中心。';
});

const payHint = computed(() => {
  if (currentDetail.value?.status === '0') {
    return '待支付订单可直接在详情弹窗里上传支付凭证并确认支付。';
  }

  return '当前订单不处于待支付状态。';
});

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getTicketOrderDetailApi(id);
    currentDetail.value = response.detail;
  } catch (error) {
    console.error(error);
    modalApi.close();
  } finally {
    detailLoading.value = false;
  }
}

const [PayModal, payModalApi] = useVbenModal({
  connectedComponent: OrderPayModal,
  destroyOnClose: true,
});

function openPayModal() {
  if (!currentDetail.value || currentDetail.value.status !== '0') {
    return;
  }

  payModalApi
    .setData({
      id: currentDetail.value.id,
      orderSn: currentDetail.value.order_sn,
      type: 'ticket',
    })
    .open();
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id: number }>();
    modalApi.setState({
      confirmDisabled: true,
      confirmText: '关闭',
      loading: true,
      showCancelButton: false,
      title: '门票订单详情',
    });

    loadDetail(data.id).finally(() => {
      modalApi.setState({
        confirmDisabled: false,
        loading: false,
      });
    });
  },
});
</script>

<template>
  <Modal class="w-full max-w-[1080px]">
    <PayModal
      @success="
        async () => {
          if (!currentDetail) return;
          await loadDetail(currentDetail.id);
          emit('success');
        }
      "
    />

    <div v-loading="detailLoading" class="min-h-[260px]">
      <TicketOrderDetailContent :detail="currentDetail" />
    </div>

    <template #prepend-footer>
      <div class="flex items-center gap-3">
        <ElButton
          v-if="currentDetail?.status === '0'"
          type="primary"
          @click="openPayModal"
        >
          确认支付
        </ElButton>
        <div class="text-xs text-muted-foreground">
          {{ payHint }} {{ verifyHint }}
        </div>
      </div>
    </template>
  </Modal>
</template>
