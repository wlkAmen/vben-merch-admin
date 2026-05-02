<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  MerchantTicketOrderItem,
  MerchantTicketOrderVerifyInfo,
} from '#/api';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { finishTicketOrderApi, getTicketOrderListApi } from '#/api';

import {
  formatOrderDateTime,
  getOrderStatusTagType,
  getVerifyStatusTagType,
} from './helper';
import OrderPayModal from './modules/order-pay-modal.vue';
import OrderUserPopover from './modules/order-user-popover.vue';
import TicketOrderDetailModal from './modules/ticket-order-detail-modal.vue';

defineOptions({ name: 'MerchantOrderTicketPage' });

interface MerchantTicketOrderTableRow extends MerchantTicketOrderItem {
  createtime_text: string;
  paytime_text: string;
  suit_display: string;
  ticket_display: string;
  verify_status: string;
  verify_status_text: string;
}

const router = useRouter();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: TicketOrderDetailModal,
  destroyOnClose: true,
});

const [PayModal, payModalApi] = useVbenModal({
  connectedComponent: OrderPayModal,
  destroyOnClose: true,
});

function normalizeVerifyInfo(
  item: MerchantTicketOrderItem,
): MerchantTicketOrderVerifyInfo | null {
  if (!item.verify_info) {
    return null;
  }

  return Array.isArray(item.verify_info)
    ? (item.verify_info[0] ?? null)
    : item.verify_info;
}

async function handlePayOrder(row: MerchantTicketOrderTableRow) {
  if (row.status !== '0') {
    ElMessage.warning('当前订单不是待支付状态');
    return;
  }

  payModalApi
    .setData({
      id: row.id,
      orderSn: row.order_sn,
      type: 'ticket',
    })
    .open();
}

async function handleFinishOrder(row: MerchantTicketOrderTableRow) {
  if (row.status !== '1') {
    ElMessage.warning('当前订单不是已支付状态');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定完成订单“${row.order_sn}”吗？`,
      '完成订单',
      {
        confirmButtonText: '确定完成',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  await finishTicketOrderApi(row.id);
  ElMessage.success('订单已完成');
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantTicketOrderTableRow;
}) {
  switch (code) {
    case 'detail': {
      detailModalApi.setData({ id: row.id }).open();
      break;
    }
    case 'finish': {
      handleFinishOrder(row);
      break;
    }
    case 'pay': {
      handlePayOrder(row);
      break;
    }
    default: {
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'keyword',
        label: '关键词',
        componentProps: {
          placeholder: '请输入订单号、联系人或手机号',
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '订单状态',
        componentProps: {
          allowClear: true,
          options: [
            { label: '交易关闭', value: '-2' },
            { label: '已取消', value: '-1' },
            { label: '待支付', value: '0' },
            { label: '已支付', value: '1' },
            { label: '已完成', value: '3' },
          ],
        },
      },
      {
        component: 'DatePicker',
        fieldName: 'date_range',
        label: '下单时间',
        componentProps: {
          endPlaceholder: '结束日期',
          startPlaceholder: '开始日期',
          type: 'daterange',
          valueFormat: 'YYYY-MM-DD',
        },
      },
    ],
    submitOnChange: true,
  },
  gridOptions: {
    columns: [
      {
        field: 'order_sn',
        minWidth: 180,
        title: '订单号',
      },
      {
        field: 'ticket_display',
        minWidth: 260,
        slots: { default: 'ticketInfo' },
        title: '门票信息',
      },
      {
        field: 'date',
        minWidth: 120,
        title: '出游日期',
      },
      {
        field: 'user_info',
        minWidth: 180,
        slots: { default: 'user' },
        title: '下单用户',
      },
      {
        field: 'realname',
        minWidth: 120,
        title: '联系人',
      },
      {
        field: 'mobile',
        minWidth: 140,
        title: '手机号',
      },
      {
        field: 'number',
        title: '数量',
        width: 90,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '订单状态',
        width: 110,
      },
      {
        field: 'verify_status_text',
        slots: { default: 'verifyStatus' },
        title: '核销状态',
        width: 110,
      },
      {
        field: 'pay_type_text',
        minWidth: 110,
        title: '支付方式',
      },
      {
        field: 'total_fee',
        title: '订单金额',
        width: 110,
      },
      {
        field: 'pay_fee',
        title: '实付金额',
        width: 110,
      },
      {
        field: 'createtime_text',
        title: '下单时间',
        width: 180,
      },
      {
        field: 'paytime_text',
        title: '支付时间',
        width: 180,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'order_sn',
            nameTitle: '门票订单',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'pay',
              show: (row: MerchantTicketOrderTableRow) => row.status === '0',
              text: '确认支付',
            },
            {
              code: 'finish',
              show: (row: MerchantTicketOrderTableRow) => row.status === '1',
              text: '完成订单',
            },
            {
              code: 'detail',
              text: '详情',
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: '操作',
        width: 210,
      },
    ],
    height: 'auto',
    keepSource: true,
    cellConfig: {
      height: 75,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const dateRange = formValues.date_range || [];
          const response = await getTicketOrderListApi({
            date_from: Array.isArray(dateRange) ? dateRange[0] : '',
            date_to: Array.isArray(dateRange) ? dateRange[1] : '',
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
          });

          return {
            items: response.list.map((item): MerchantTicketOrderTableRow => {
              const verifyInfo = normalizeVerifyInfo(item);

              return {
                ...item,
                createtime_text: formatOrderDateTime(item.createtime),
                paytime_text: formatOrderDateTime(item.paytime),
                suit_display: item.suit_name || item.suit_title || '-',
                ticket_display: item.ticket_title || item.title || '-',
                verify_status: verifyInfo?.status || item.verify_status || '',
                verify_status_text:
                  verifyInfo?.status_text || item.verify_status_text || '-',
              };
            }),
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
  } as VxeTableGridOptions<MerchantTicketOrderTableRow>,
});
</script>

<template>
  <Page
    auto-content-height
    description="查看当前商家的门票订单，支持按关键词、订单状态和下单时间筛选，并在详情中核对核销信息。"
    title="门票订单"
  >
    <template #extra>
      <ElButton @click="router.push('/verify/query')">前往核销中心</ElButton>
    </template>

    <DetailModal @success="gridApi.query()" />
    <PayModal @success="gridApi.query()" />

    <Grid table-title="门票订单列表">
      <template #toolbar-tools>
        <div class="text-sm text-muted-foreground">
          支持确认支付和完成订单；核销操作统一在核销中心完成。
        </div>
      </template>

      <template #ticketInfo="{ row }">
        <div class="min-w-0 space-y-1 text-left">
          <div class="truncate font-medium text-foreground">
            {{ row.ticket_display }}
          </div>
          <div class="truncate text-xs text-muted-foreground">
            套餐：{{ row.suit_display }}
          </div>
        </div>
      </template>

      <template #user="{ row }">
        <OrderUserPopover :user-info="row.user_info" />
      </template>

      <template #status="{ row }">
        <ElTag :type="getOrderStatusTagType(row.status)" effect="light" round>
          {{ row.status_text || row.status || '-' }}
        </ElTag>
      </template>

      <template #verifyStatus="{ row }">
        <ElTag
          :type="getVerifyStatusTagType(row.verify_status)"
          effect="light"
          round
        >
          {{ row.verify_status_text || '-' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
