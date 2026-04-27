<script lang="ts" setup>
import type { MerchantRefundDetail } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import {
  getRefundDetailApi,
  passRefundApi,
  rejectRefundApi,
} from '#/api';

import RefundOrderDetailContent from './refund-order-detail-content.vue';

defineOptions({ name: 'MerchantRefundOrderDetailModal' });

const emit = defineEmits<{
  success: [detail: MerchantRefundDetail];
}>();

const currentDetail = ref<MerchantRefundDetail | null>(null);
const detailLoading = ref(false);

const footerHint = computed(() => {
  if (currentDetail.value?.can_pass || currentDetail.value?.can_reject) {
    return '待处理退款单可直接在详情弹窗中完成通过或拒绝，处理结果会同步回写列表。';
  }

  return '当前退款单已处理完成或不可操作，关闭即可返回列表。';
});

function syncActionState(detail: MerchantRefundDetail | null) {
  modalApi.setState({
    confirmText: detail?.can_pass ? '通过退款' : '关闭',
    showCancelButton: true,
  });
}

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getRefundDetailApi(id);
    currentDetail.value = response.detail;
    syncActionState(response.detail);
  } catch (error) {
    console.error(error);
    modalApi.close();
  } finally {
    detailLoading.value = false;
  }
}

async function handlePassRefund() {
  if (!currentDetail.value?.can_pass) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定通过退款单“${currentDetail.value.refund_sn}”吗？`,
      '通过退款',
      {
        confirmButtonText: '确定通过',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  modalApi.lock();
  try {
    const response = await passRefundApi(currentDetail.value.id);
    currentDetail.value = response.detail;
    syncActionState(response.detail);
    emit('success', response.detail);
    ElMessage.success('退款已通过');
  } finally {
    modalApi.unlock();
  }
}

async function handleRejectRefund() {
  if (!currentDetail.value?.can_reject) {
    return;
  }

  let promptResult: { value: string };

  try {
    promptResult = await ElMessageBox.prompt(
      '请输入拒绝原因',
      '拒绝退款',
      {
        confirmButtonText: '提交拒绝',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入拒绝原因',
        inputValidator: (value) => {
          if (!value.trim()) {
            return '拒绝原因不能为空';
          }
          return true;
        },
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  const rejectMsg = promptResult.value.trim();

  modalApi.lock();
  try {
    const response = await rejectRefundApi({
      id: currentDetail.value.id,
      reject_msg: rejectMsg,
    });
    currentDetail.value = response.detail;
    syncActionState(response.detail);
    emit('success', response.detail);
    ElMessage.success('退款已拒绝');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!currentDetail.value?.can_pass) {
      modalApi.close();
      return;
    }

    await handlePassRefund();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id: number }>();
    modalApi.setState({
      confirmDisabled: true,
      confirmText: '通过退款',
      loading: true,
      showCancelButton: true,
      title: '退款订单详情',
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
  <Modal class="w-full max-w-[1100px]">
    <div v-loading="detailLoading" class="min-h-[260px]">
      <RefundOrderDetailContent :detail="currentDetail" />
    </div>

    <template #prepend-footer>
      <div class="flex items-center gap-3">
        <ElButton
          v-if="currentDetail?.can_reject"
          type="danger"
          @click="handleRejectRefund"
        >
          拒绝退款
        </ElButton>
        <div class="text-xs text-muted-foreground">
          {{ footerHint }}
        </div>
      </div>
    </template>
  </Modal>
</template>
