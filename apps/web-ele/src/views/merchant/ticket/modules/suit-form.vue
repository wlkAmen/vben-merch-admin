<script lang="ts" setup>
import type {
  MerchantTicketMetaResult,
  MerchantTicketSuitDetailResult,
} from '#/api';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { VbenTiptap } from '@vben/plugins/tiptap';

import type { FormInstance, FormRules } from 'element-plus';

import {
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElTimePicker,
} from 'element-plus';

import {
  createTicketSuitApi,
  getTicketSuitDetailApi,
  updateTicketSuitApi,
} from '#/api';

const emit = defineEmits<{
  success: [
    payload: {
      created: boolean;
      detail: MerchantTicketSuitDetailResult['detail'] | null;
    },
  ];
}>();

interface SuitFormState {
  before?: number;
  beforetime: string;
  content: string;
  explain: string;
  name: string;
  passenger: string;
  price: string;
  tags: string[];
  type_id: string;
}

const formRef = ref<FormInstance>();
const currentSuit = ref<MerchantTicketSuitDetailResult['detail'] | null>(null);
const submitting = ref(false);

const form = reactive<SuitFormState>({
  before: 0,
  beforetime: '',
  content: '',
  explain: '',
  name: '',
  passenger: '0',
  price: '',
  tags: [],
  type_id: '',
});

const rules: FormRules<SuitFormState> = {
  name: [{ message: '请输入套餐名称', required: true, trigger: 'blur' }],
  type_id: [{ message: '请选择门票类型', required: true, trigger: 'change' }],
};

function resetForm() {
  form.before = 0;
  form.beforetime = '';
  form.content = '';
  form.explain = '';
  form.name = '';
  form.passenger = '0';
  form.price = '';
  form.tags = [];
  form.type_id = '';
}

function formatDateTime(timestamp?: null | number) {
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

const drawerData = computed(() =>
  drawerApi.getData<{
    id?: number;
    meta?: MerchantTicketMetaResult | null;
    ticketId: number;
  }>(),
);

const typeOptions = computed(() => drawerData.value?.meta?.type_options || []);
const passengerOptions = computed(
  () => drawerData.value?.meta?.passenger_options || [],
);

const drawerTitle = computed(() => {
  return currentSuit.value?.id ? '编辑门票套餐' : '新增门票套餐';
});

const auditStatusTagType = computed(() => {
  switch (currentSuit.value?.audit_status) {
    case '1': {
      return 'success';
    }
    case '2': {
      return 'danger';
    }
    default: {
      return 'warning';
    }
  }
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
      return;
    }

    const data = drawerData.value;
    if (!data?.ticketId) {
      ElMessage.error('门票参数错误');
      return;
    }

    submitting.value = true;
    drawerApi.lock();
    try {
      let response;
      if (data.id) {
        response = await updateTicketSuitApi({
          before: form.before,
          beforetime: form.beforetime,
          content: form.content,
          explain: form.explain,
          id: data.id,
          name: form.name,
          passenger: form.passenger,
          price: form.price,
          tags: [...form.tags],
          type_id: form.type_id,
        });
        ElMessage.success('门票套餐已更新，已重新进入待审核');
      } else {
        response = await createTicketSuitApi({
          before: form.before,
          beforetime: form.beforetime,
          content: form.content,
          explain: form.explain,
          name: form.name,
          passenger: form.passenger,
          price: form.price,
          tags: [...form.tags],
          ticket_id: data.ticketId,
          type_id: form.type_id,
        });
        ElMessage.success('门票套餐已创建，请继续维护价格库存');
      }

      drawerApi.close();
      emit('success', {
        created: !data.id,
        detail: response?.detail || null,
      });
    } finally {
      submitting.value = false;
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    currentSuit.value = null;
    resetForm();
    await nextTick();
    formRef.value?.clearValidate();

    const data = drawerData.value;
    if (!data?.id) {
      return;
    }

    const response = await getTicketSuitDetailApi(data.id);
    currentSuit.value = response.detail;

    form.before = response.detail.before || 0;
    form.beforetime = response.detail.beforetime || '';
    form.content = response.detail.content || '';
    form.explain = response.detail.explain || '';
    form.name = response.detail.name || '';
    form.passenger = response.detail.passenger || '0';
    form.price = response.detail.price || '';
    form.tags = [...(response.detail.tags || [])];
    form.type_id = response.detail.type_id || '';
  },
});
</script>

<template>
  <Drawer :title="drawerTitle" class="w-full max-w-[960px]">
    <div class="grid gap-4">
      <ElAlert
        :closable="false"
        show-icon
        title="景点基础资料由平台维护，这里只维护当前商家的门票套餐与审核流相关信息。"
        type="info"
      />

      <div v-if="currentSuit" class="grid gap-3 rounded-xl border p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-muted-foreground">审核状态</span>
          <ElTag :type="auditStatusTagType" effect="light" round>
            {{ currentSuit.audit_status_text || currentSuit.audit_status }}
          </ElTag>
          <span class="text-xs text-muted-foreground">
            审核时间：{{ formatDateTime(currentSuit.audit_time) }}
          </span>
        </div>

        <div
          v-if="currentSuit.audit_status === '2' && currentSuit.audit_remark"
          class="rounded-lg border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-3 py-2 text-sm text-muted-foreground"
        >
          驳回原因：{{ currentSuit.audit_remark }}
        </div>
      </div>

      <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="套餐名称" prop="name">
            <ElInput v-model="form.name" placeholder="请输入套餐名称" />
          </ElFormItem>

          <ElFormItem label="门票类型" prop="type_id">
            <ElSelect v-model="form.type_id" clearable placeholder="请选择门票类型">
              <ElOption
                v-for="item in typeOptions"
                :key="item.id"
                :label="item.name"
                :value="String(item.id)"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="原始价格">
            <ElInput v-model="form.price" placeholder="用于列表展示的原始价格" />
          </ElFormItem>

          <ElFormItem label="提前预订天数">
            <ElInputNumber
              v-model="form.before"
              :controls="false"
              :min="0"
              class="w-full"
              placeholder="请输入提前预订天数"
            />
          </ElFormItem>

          <ElFormItem label="当天截止时间">
            <ElTimePicker
              v-model="form.beforetime"
              class="w-full"
              clearable
              placeholder="请选择当天截止时间"
              value-format="HH:mm:ss"
            />
          </ElFormItem>

          <ElFormItem label="游客信息要求">
            <ElSelect v-model="form.passenger" clearable placeholder="请选择游客信息要求">
              <ElOption
                v-for="item in passengerOptions"
                :key="String(item.value)"
                :label="item.label"
                :value="String(item.value)"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem class="md:col-span-2" label="标签">
            <ElSelect
              v-model="form.tags"
              allow-create
              clearable
              default-first-option
              filterable
              multiple
              placeholder="可直接输入多个标签并回车创建"
              reserve-keyword
            />
          </ElFormItem>

          <ElFormItem class="md:col-span-2" label="取票说明">
            <ElInput
              v-model="form.explain"
              :rows="3"
              placeholder="请输入取票说明"
              type="textarea"
            />
          </ElFormItem>

          <ElFormItem class="md:col-span-2" label="套餐介绍">
            <VbenTiptap
              v-model="form.content"
              :min-height="220"
              placeholder="请输入门票套餐介绍"
            />
          </ElFormItem>
        </div>
      </ElForm>
    </div>
  </Drawer>
</template>
