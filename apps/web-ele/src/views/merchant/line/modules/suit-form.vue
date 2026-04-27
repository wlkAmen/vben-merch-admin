<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { MerchantLineSuitDetailResult } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createLineSuitApi,
  getLineSuitDetailApi,
  updateLineSuitApi,
} from '#/api';

const emit = defineEmits<{
  success: [
    payload: {
      created: boolean;
      detail: MerchantLineSuitDetailResult['detail'] | null;
    },
  ];
}>();

const currentSuit = ref<MerchantLineSuitDetailResult['detail'] | null>(null);

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '套餐名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'price',
    label: '原始价格',
  },
  {
    component: 'Input',
    fieldName: 'person',
    label: '成人标准',
  },
  {
    component: 'Input',
    fieldName: 'oldperson',
    label: '老人标准',
  },
  {
    component: 'Input',
    fieldName: 'child',
    label: '儿童标准',
  },
  {
    component: 'Input',
    fieldName: 'room',
    label: '单房差',
  },
  {
    component: 'Input',
    fieldName: 'content',
    label: '套餐说明',
    componentProps: {
      rows: 4,
      type: 'textarea',
    },
    formItemClass: 'col-span-2',
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4 md:grid-cols-2',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const drawerData = drawerApi.getData<{ id?: number; lineId: number }>();
    const values = await formApi.getValues();

    drawerApi.lock();
    try {
      let response;
      if (drawerData.id) {
        response = await updateLineSuitApi({
          id: drawerData.id,
          ...values,
          line_id: drawerData.lineId,
        });
        ElMessage.success('套餐已更新');
      } else {
        response = await createLineSuitApi({
          ...values,
          line_id: drawerData.lineId,
        });
        ElMessage.success('套餐已创建，请继续维护价格库存');
      }

      drawerApi.close();
      emit('success', {
        created: !drawerData.id,
        detail: response?.detail || null,
      });
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    currentSuit.value = null;
    formApi.resetForm();

    const drawerData = drawerApi.getData<{ id?: number; lineId: number }>();
    if (!drawerData.id) {
      return;
    }

    const response = await getLineSuitDetailApi(drawerData.id);
    currentSuit.value = response.detail;

    await nextTick();
    formApi.setValues({
      child: response.detail.child || '',
      content: response.detail.content || '',
      name: response.detail.name || '',
      oldperson: response.detail.oldperson || '',
      person: response.detail.person || '',
      price: response.detail.price || '',
      room: response.detail.room || '',
    });
  },
});

const drawerTitle = computed(() => {
  return currentSuit.value?.id ? '编辑套餐' : '新增套餐';
});
</script>

<template>
  <Drawer :title="drawerTitle" class="w-full max-w-[880px]">
    <div class="grid gap-4">
      <div class="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        套餐页只维护套餐名称、标准和说明。价格库存请到独立的“线路价格库存”页按日历维护。
      </div>
      <Form />
    </div>
  </Drawer>
</template>
