<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  MerchantTicketDetail,
  MerchantTicketMetaResult,
  MerchantTicketSuitItem,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElMessage, ElMessageBox, ElTag, ElTooltip } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTicketSuitApi,
  getTicketDetailApi,
  getTicketOptionsApi,
  getTicketSuitListApi,
} from '#/api';

import SuitFormDrawer from './modules/suit-form.vue';

defineOptions({ name: 'MerchantTicketSuitPage' });

interface MerchantTicketSuitTableRow extends MerchantTicketSuitItem {
  passenger_text: string;
  type_name: string;
  updatetime_text: string;
}

const route = useRoute();
const router = useRouter();

const ticketDetail = ref<MerchantTicketDetail | null>(null);
const metaRef = ref<MerchantTicketMetaResult | null>(null);
const ticketId = computed(() => Number(route.params.id || 0));

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: SuitFormDrawer,
  destroyOnClose: true,
});

function formatDateTime(timestamp: number) {
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

function getTypeName(typeId: string) {
  return (
    metaRef.value?.type_options.find((item) => String(item.id) === String(typeId))
      ?.name || typeId || '-'
  );
}

function getPassengerText(value: string) {
  return (
    metaRef.value?.passenger_options.find(
      (item) => String(item.value) === String(value),
    )?.label || value || '-'
  );
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'keyword',
        label: '关键词',
        componentProps: {
          placeholder: '请输入套餐名称关键词',
        },
      },
      {
        component: 'Select',
        fieldName: 'audit_status',
        label: '审核状态',
        componentProps: {
          allowClear: true,
          options: [],
        },
      },
    ],
    submitOnChange: true,
  },
  gridOptions: {
    columns: [
      {
        align: 'left',
        field: 'name',
        minWidth: 220,
        title: '套餐名称',
      },
      {
        field: 'type_name',
        minWidth: 140,
        title: '门票类型',
      },
      {
        field: 'price',
        title: '原始价格',
        width: 120,
      },
      {
        field: 'passenger_text',
        minWidth: 140,
        title: '游客信息要求',
      },
      {
        field: 'before',
        title: '提前预订',
        width: 110,
      },
      {
        field: 'beforetime',
        title: '当天截止',
        width: 120,
      },
      {
        field: 'audit_status',
        slots: { default: 'auditStatus' },
        title: '审核状态',
        width: 120,
      },
      {
        field: 'updatetime_text',
        title: '更新时间',
        width: 180,
      },
      {
        align: 'right',
        cellRender: {
          attrs: {
            nameField: 'name',
            nameTitle: '门票套餐',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'edit',
              text: '编辑',
            },
            {
              code: 'price',
              text: '价格库存',
            },
            {
              code: 'delete',
              text: '删除',
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: '操作',
        width: 220,
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const response = await getTicketSuitListApi({
            audit_status: formValues.audit_status,
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            ticket_id: ticketId.value,
          });

          return {
            items: response.list.map((item): MerchantTicketSuitTableRow => ({
              ...item,
              passenger_text: getPassengerText(item.passenger),
              type_name: getTypeName(item.type_id),
              updatetime_text: formatDateTime(item.updatetime),
            })),
            total: response.total,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<MerchantTicketSuitTableRow>,
});

function onRefresh() {
  gridApi.query();
}

function handleSuitSuccess(payload?: {
  created: boolean;
  detail: MerchantTicketSuitItem | null;
}) {
  onRefresh();

  if (payload?.created && payload.detail?.id) {
    router.push({
      path: `/ticket/price/${ticketId.value}`,
      query: { suitId: String(payload.detail.id) },
    });
  }
}

async function loadTicketContext() {
  if (!ticketId.value) {
    return;
  }

  const [detailResponse, metaResponse] = await Promise.all([
    getTicketDetailApi(ticketId.value),
    getTicketOptionsApi(),
  ]);

  ticketDetail.value = detailResponse.detail;
  metaRef.value = metaResponse;

  gridApi.formApi.updateSchema([
    {
      fieldName: 'audit_status',
      componentProps: {
        allowClear: true,
        options: [
          { label: '待审核', value: '0' },
          { label: '审核通过', value: '1' },
          { label: '驳回', value: '2' },
        ],
      },
    },
  ]);
}

function onCreate() {
  formDrawerApi
    .setData({
      meta: metaRef.value,
      ticketId: ticketId.value,
    })
    .open();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<MerchantTicketSuitTableRow>) {
  switch (code) {
    case 'edit': {
      formDrawerApi
        .setData({
          id: row.id,
          meta: metaRef.value,
          ticketId: ticketId.value,
        })
        .open();
      break;
    }
    case 'price': {
      router.push({
        path: `/ticket/price/${ticketId.value}`,
        query: { suitId: String(row.id) },
      });
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    default: {
      break;
    }
  }
}

async function onDelete(row: MerchantTicketSuitTableRow) {
  try {
    await ElMessageBox.confirm(
      `确定删除门票套餐“${row.name}”吗？`,
      '删除门票套餐',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await deleteTicketSuitApi(row.id);
    ElMessage.success('门票套餐已删除');
    onRefresh();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
    }
  }
}

onMounted(() => {
  loadTicketContext();
});
</script>

<template>
  <Page
    auto-content-height
    :description="ticketDetail?.title || '维护当前景点下的门票套餐与价格日历。'"
    title="门票套餐管理"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push(`/ticket/detail/${ticketId}`)">返回详情</ElButton>
        <ElButton type="primary" plain @click="router.push(`/ticket/price/${ticketId}`)">
          价格库存页
        </ElButton>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增套餐
        </ElButton>
      </div>
    </template>

    <FormDrawer @success="handleSuitSuccess" />

    <Grid table-title="门票套餐列表">
      <template #auditStatus="{ row }">
        <ElTooltip
          v-if="row.audit_status === '2' && row.audit_remark"
          :content="row.audit_remark"
          placement="top"
        >
          <ElTag effect="light" round type="danger">
            {{ row.audit_status_text || '驳回' }}
          </ElTag>
        </ElTooltip>

        <ElTag
          v-else
          :type="row.audit_status === '1' ? 'success' : 'warning'"
          effect="light"
          round
        >
          {{ row.audit_status_text || row.audit_status || '-' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
