<script lang="ts" setup>
import type {
  EditableTicketPriceItem,
  TicketPriceEditorForm,
  TicketPriceEditorMode,
} from '../price-helper';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup,
  ElTag,
} from 'element-plus';

import {
  TICKET_PRICE_MONTH_DAY_OPTIONS,
  TICKET_PRICE_WEEK_OPTIONS,
  createTicketPriceEditorForm,
  createTicketPriceEditorFormByEntry,
  getMatchedTicketDates,
} from '../price-helper';

defineOptions({ name: 'MerchantTicketPriceEditorModal' });

const emit = defineEmits<{
  apply: [
    payload: {
      action: 'remove' | 'upsert';
      form: TicketPriceEditorForm;
      matchedDates: string[];
    },
  ];
}>();

const mode = ref<TicketPriceEditorMode>('single');
const suitName = ref('');
const hasExistingEntry = ref(false);
const form = ref<TicketPriceEditorForm>(createTicketPriceEditorForm('single'));

const modalTitle = computed(() => {
  if (mode.value === 'single') {
    return `${suitName.value} · ${form.value.date || '单日'}报价`;
  }
  return `${suitName.value} · 批量设置报价`;
});

const removeButtonText = computed(() => {
  return mode.value === 'single' ? '清空当天报价' : '清空匹配日期';
});

const matchedDatePreview = computed(() => {
  try {
    return getMatchedTicketDates(form.value);
  } catch {
    return [];
  }
});

const matchedDatePreviewItems = computed(() => {
  return matchedDatePreview.value.slice(0, 6);
});

const matchedDateOverflowCount = computed(() => {
  return Math.max(
    0,
    matchedDatePreview.value.length - matchedDatePreviewItems.value.length,
  );
});

function resetForm(
  nextMode: TicketPriceEditorMode,
  date = '',
  entry?: EditableTicketPriceItem,
) {
  form.value = createTicketPriceEditorFormByEntry(nextMode, date, entry);
}

function emitApply(action: 'remove' | 'upsert') {
  let matchedDates: string[] = [];
  try {
    matchedDates = getMatchedTicketDates(form.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '日期条件校验失败');
    return;
  }

  emit('apply', {
    action,
    form: {
      ...form.value,
      dateDays: [...form.value.dateDays],
      rangedate: Array.isArray(form.value.rangedate)
        ? [...form.value.rangedate]
        : [],
      weeks: [...form.value.weeks],
    },
    matchedDates,
  });
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    emitApply('upsert');
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{
      date?: string;
      entry?: EditableTicketPriceItem;
      mode: TicketPriceEditorMode;
      suitName: string;
    }>();

    suitName.value = data.suitName || '门票套餐';
    mode.value = data.mode;
    hasExistingEntry.value = !!data.entry;
    resetForm(data.mode, data.date, data.entry);
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-full max-w-[880px]">
    <div class="grid gap-4">
      <ElAlert
        :closable="false"
        show-icon
        title="这里是本地编辑草稿，确认后会先写入当前页面，再由“保存当前套餐”统一提交到后端。"
        type="info"
      />

      <div class="rounded-xl border p-4">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-sm font-medium">适用日期</div>
            <div class="text-xs text-muted-foreground">
              {{ mode === 'single' ? '确认后只会更新当前这一天。' : '先选日期范围，再决定按全部日期、星期或日期号批量套用。' }}
            </div>
          </div>

          <ElTag
            :effect="hasExistingEntry ? 'light' : 'plain'"
            round
            :type="hasExistingEntry ? 'warning' : 'info'"
          >
            {{ hasExistingEntry ? '已有报价，将被覆盖' : '新建报价' }}
          </ElTag>
        </div>

        <div v-if="mode === 'single'" class="rounded-xl border bg-muted/20 px-4 py-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-medium">报价日期</span>
            <ElTag effect="plain" round size="large">
              {{ form.date }}
            </ElTag>
            <span class="text-xs text-muted-foreground">
              {{ hasExistingEntry ? '当前日期已有报价，确认后会覆盖。' : '当前日期还没有报价。' }}
            </span>
          </div>
        </div>

        <template v-else>
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div class="rounded-xl border bg-muted/20 p-4">
              <div class="space-y-2">
                <div class="text-sm font-medium">报价日期范围</div>
                <ElDatePicker
                  v-model="form.rangedate"
                  class="w-full"
                  end-placeholder="结束日期"
                  range-separator="至"
                  start-placeholder="开始日期"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                />
              </div>
            </div>

            <div class="rounded-xl border bg-muted/20 p-4">
              <div class="text-sm font-medium">预计覆盖</div>
              <div class="mt-2 text-2xl font-semibold">
                {{ matchedDatePreview.length }}
                <span class="text-sm font-normal text-muted-foreground">天</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <ElTag
                  v-for="item in matchedDatePreviewItems"
                  :key="item"
                  effect="plain"
                  round
                  size="small"
                >
                  {{ item.slice(5) }}
                </ElTag>
                <ElTag
                  v-if="matchedDateOverflowCount > 0"
                  effect="plain"
                  round
                  size="small"
                  type="info"
                >
                  +{{ matchedDateOverflowCount }}
                </ElTag>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-xl border bg-muted/20 p-4">
            <div class="text-sm font-medium">应用方式</div>
            <div class="mt-3">
              <ElRadioGroup v-model="form.dateType">
                <ElRadio :value="1">全部日期</ElRadio>
                <ElRadio :value="2">按星期筛选</ElRadio>
                <ElRadio :value="3">按日期号筛选</ElRadio>
              </ElRadioGroup>
            </div>

            <div v-if="form.dateType === 2" class="mt-4 space-y-2">
              <div class="text-sm font-medium">星期条件</div>
              <ElCheckboxGroup v-model="form.weeks">
                <ElCheckbox
                  v-for="item in TICKET_PRICE_WEEK_OPTIONS"
                  :key="item.value"
                  :label="item.value"
                  border
                >
                  {{ item.label }}
                </ElCheckbox>
              </ElCheckboxGroup>
            </div>

            <div v-if="form.dateType === 3" class="mt-4 space-y-2">
              <div class="text-sm font-medium">日期号条件</div>
              <ElCheckboxGroup
                v-model="form.dateDays"
                class="ticket-price-date-days grid grid-cols-7 gap-2 md:grid-cols-10"
              >
                <ElCheckbox
                  v-for="item in TICKET_PRICE_MONTH_DAY_OPTIONS"
                  :key="item"
                  :label="item"
                  border
                >
                  {{ item }}
                </ElCheckbox>
              </ElCheckboxGroup>
            </div>
          </div>
        </template>
      </div>

      <div class="rounded-xl border p-4">
        <div class="mb-4">
          <div class="text-sm font-medium">价格与库存</div>
          <div class="text-xs text-muted-foreground">
            门票只维护库存、成本价和销售价三项核心数据。
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-xl border bg-muted/10 p-4">
            <div class="space-y-2">
              <div class="text-sm font-medium">库存</div>
              <ElInputNumber
                v-model="form.stock"
                :controls="false"
                :min="-1"
                class="w-full"
                placeholder="-1 表示不限库存"
              />
            </div>
          </div>

          <div class="rounded-xl border bg-muted/10 p-4">
            <div class="space-y-2">
              <div class="text-sm font-medium">成本价</div>
              <ElInputNumber
                v-model="form.base_price"
                :controls="false"
                :min="0"
                :precision="2"
                class="w-full"
                placeholder="请输入成本价"
              />
            </div>
          </div>

          <div class="rounded-xl border bg-muted/10 p-4">
            <div class="space-y-2">
              <div class="text-sm font-medium">销售价</div>
              <ElInputNumber
                v-model="form.price"
                :controls="false"
                :min="0"
                :precision="2"
                class="w-full"
                placeholder="请输入销售价"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
        <div class="text-xs text-muted-foreground">
          {{ mode === 'single' ? '不需要这一天的报价时，可以直接清空当天。' : '想批量取消一段日期的报价时，可以直接清空当前匹配结果。' }}
        </div>

        <ElButton plain type="danger" @click="emitApply('remove')">
          {{ removeButtonText }}
        </ElButton>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.ticket-price-date-days .el-checkbox) {
  justify-content: flex-start;
  margin-right: 0;
  min-width: 0;
}

:deep(.ticket-price-date-days .el-checkbox.is-bordered) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  margin-left: 0;
  padding: 0 12px;
}

:deep(.ticket-price-date-days .el-checkbox__input) {
  margin-right: 0;
}

:deep(.ticket-price-date-days .el-checkbox__label) {
  padding-left: 0;
  line-height: 1;
}
</style>
