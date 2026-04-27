<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { MerchantExpressOptionItem } from '#/api';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';

import {
  getExpressOptionsApi,
  sendGoodsOrderApi,
} from '#/api';

defineOptions({ name: 'MerchantGoodsOrderSendModal' });

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const optionsLoading = ref(false);
const expressOptions = ref<MerchantExpressOptionItem[]>([]);

const form = reactive({
  express_id: undefined as number | undefined,
  express_no: '',
  id: 0,
});

const rules: FormRules = {
  express_id: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  express_no: [{ required: true, message: '请输入快递单号', trigger: 'blur' }],
};

function resetForm(id = 0) {
  form.id = id;
  form.express_id = undefined;
  form.express_no = '';
  formRef.value?.clearValidate();
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const response = await getExpressOptionsApi();
    expressOptions.value = response.express_options || [];
  } finally {
    optionsLoading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const valid = await formRef.value?.validate().then(() => true).catch(() => false);
    if (!valid) {
      return;
    }

    loading.value = true;
    modalApi.lock();
    try {
      await sendGoodsOrderApi({
        express_id: Number(form.express_id),
        express_no: form.express_no.trim(),
        id: form.id,
      });
      ElMessage.success('订单已发货');
      emit('success');
      modalApi.close();
    } finally {
      loading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id: number }>();
    resetForm(data.id);
    modalApi.setState({
      confirmText: '确认发货',
      loading: false,
      showCancelButton: true,
      title: '商品订单发货',
    });
    loadOptions();
  },
});
</script>

<template>
  <Modal class="w-full max-w-[560px]">
    <div class="min-h-[220px]">
      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
      >
        <ElFormItem label="快递公司" prop="express_id">
          <ElSelect
            v-model="form.express_id"
            :loading="optionsLoading"
            class="w-full"
            filterable
            placeholder="请选择快递公司"
          >
            <ElOption
              v-for="item in expressOptions"
              :key="item.id"
              :label="`${item.name}（${item.code}）`"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="快递单号" prop="express_no">
          <ElInput
            v-model="form.express_no"
            placeholder="请输入快递单号"
          />
        </ElFormItem>
      </ElForm>

      <div class="mt-4 rounded-xl border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        仅 `status=1` 的待发货订单允许执行发货，发货后订单状态会改为待收货。
      </div>
    </div>
  </Modal>
</template>
