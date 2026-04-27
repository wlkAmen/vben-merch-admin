<script lang="ts" setup>
import type { MerchantVerifyDetail } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  getTicketVerifyDetailApi,
  useTicketVerifyApi,
} from '#/api';

import VerifyDetailContent from './verify-detail-content.vue';

defineOptions({ name: 'MerchantVerifyDetailModal' });

const emit = defineEmits<{
  success: [detail: MerchantVerifyDetail];
}>();

const detailLoading = ref(false);
const currentDetail = ref<MerchantVerifyDetail | null>(null);

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getTicketVerifyDetailApi({ id });
    currentDetail.value = response.detail;
    modalApi.setState({
      confirmText: response.detail.status === '0' ? '执行核销' : '关闭',
      showCancelButton: response.detail.status === '0',
    });
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
  onConfirm: async () => {
    if (!currentDetail.value) {
      modalApi.close();
      return;
    }

    if (currentDetail.value.status !== '0') {
      modalApi.close();
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定核销核销码“${currentDetail.value.code}”吗？`,
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

    modalApi.lock();
    try {
      const response = await useTicketVerifyApi({ id: currentDetail.value.id });
      currentDetail.value = response.detail;
      modalApi.setState({
        confirmText: '关闭',
        showCancelButton: false,
      });
      emit('success', response.detail);
      ElMessage.success('核销成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id: number }>();
    modalApi.setState({
      confirmDisabled: true,
      confirmText: '执行核销',
      loading: true,
      showCancelButton: true,
      title: '核销详情',
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
  <Modal class="w-full max-w-[980px]">
    <div v-loading="detailLoading" class="min-h-[240px]">
      <VerifyDetailContent :detail="currentDetail" />
    </div>

    <template #prepend-footer>
      <div
        v-if="currentDetail?.status === '0'"
        class="text-xs text-muted-foreground"
      >
        待核销记录执行后会立即更新状态并回写到核销记录列表。
      </div>
      <div v-else class="text-xs text-muted-foreground">
        当前记录已核销，关闭即可返回列表。
      </div>
    </template>
  </Modal>
</template>
