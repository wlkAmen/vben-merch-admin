<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { payLineOrderApi, payTicketOrderApi } from '#/api';
import MerchantImageUpload from '#/views/merchant/common/image-upload.vue';

defineOptions({ name: 'MerchantOrderPayModal' });

const emit = defineEmits<{
  success: [];
}>();

const payCert = ref('');
const currentType = ref<'line' | 'ticket'>('line');
const currentOrderSn = ref('');
const currentId = ref(0);

function getModalTitle() {
  return currentType.value === 'line' ? '线路订单确认支付' : '门票订单确认支付';
}

function resetState() {
  payCert.value = '';
  currentType.value = 'line';
  currentOrderSn.value = '';
  currentId.value = 0;
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    modalApi.lock();
    try {
      await (currentType.value === 'line'
        ? payLineOrderApi({
            id: currentId.value,
            pay_cert: payCert.value || undefined,
          })
        : payTicketOrderApi({
            id: currentId.value,
            pay_cert: payCert.value || undefined,
          }));

      ElMessage.success('订单已确认支付');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    resetState();
    const data = modalApi.getData<{
      id: number;
      orderSn: string;
      type: 'line' | 'ticket';
    }>();

    currentId.value = data.id;
    currentOrderSn.value = data.orderSn;
    currentType.value = data.type;

    modalApi.setState({
      confirmText: '确认支付',
      showCancelButton: true,
      title: getModalTitle(),
    });
  },
});
</script>

<template>
  <Modal class="w-full max-w-[560px]">
    <div class="grid min-h-[260px] gap-4">
      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="text-sm text-muted-foreground">
          订单号：{{ currentOrderSn || '-' }}
        </div>
        <div class="mt-2 text-sm leading-6 text-muted-foreground">
          确认后订单会走后台支付逻辑，支付方式会更新为系统入账。可选上传支付凭证，方便后续核对；如果没有留档要求，也可以直接确认。
        </div>
      </div>

      <div class="rounded-2xl border bg-card p-4 shadow-sm">
        <div class="mb-3 text-sm font-medium">支付凭证</div>
        <MerchantImageUpload v-model="payCert" />
      </div>
    </div>
  </Modal>
</template>
