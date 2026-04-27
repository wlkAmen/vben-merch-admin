<script lang="ts" setup>
import type { MerchantGoodsOrderDetail } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getGoodsOrderDetailApi } from '#/api';

import GoodsOrderDetailContent from './goods-order-detail-content.vue';

defineOptions({ name: 'MerchantGoodsOrderDetailModal' });

const currentDetail = ref<MerchantGoodsOrderDetail | null>(null);
const detailLoading = ref(false);

const footerHint = computed(() => {
  if (currentDetail.value?.express?.length) {
    return '订单详情会集中展示收货信息、商品明细和发货记录，便于后续对接发货流程。';
  }

  return '当前订单还没有发货记录，本页先提供只读信息查看。';
});

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getGoodsOrderDetailApi(id);
    currentDetail.value = response.detail;
  } catch (error) {
    console.error(error);
    modalApi.close();
  } finally {
    detailLoading.value = false;
  }
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
      title: '商品订单详情',
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
  <Modal class="w-full max-w-[1160px]">
    <div v-loading="detailLoading" class="min-h-[260px]">
      <GoodsOrderDetailContent :detail="currentDetail" />
    </div>

    <template #prepend-footer>
      <div class="text-xs text-muted-foreground">
        {{ footerHint }}
      </div>
    </template>
  </Modal>
</template>
