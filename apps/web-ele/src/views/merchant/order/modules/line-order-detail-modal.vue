<script lang="ts" setup>
import type { MerchantLineOrderDetail } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton } from 'element-plus';

import { getLineOrderDetailApi } from '#/api';

import LineOrderDetailContent from './line-order-detail-content.vue';
import OrderPayModal from './order-pay-modal.vue';

defineOptions({ name: 'MerchantLineOrderDetailModal' });

const emit = defineEmits<{
  success: [];
}>();

const currentDetail = ref<MerchantLineOrderDetail | null>(null);
const detailLoading = ref(false);

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getLineOrderDetailApi(id);
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
      type: 'line',
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
      title: '线路订单详情',
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
  <Modal class="w-full max-w-[1120px]">
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
      <LineOrderDetailContent :detail="currentDetail" />
    </div>

    <template #prepend-footer>
      <div class="flex items-center gap-3">
        <ElButton
          v-if="currentDetail?.status === '0'"
          type="primary"
          plain
          @click="openPayModal"
        >
          确认支付
        </ElButton>
      </div>
    </template>
  </Modal>
</template>
