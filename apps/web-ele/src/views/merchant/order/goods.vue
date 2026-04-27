<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantGoodsOrderItem } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  finishGoodsOrderApi,
  getGoodsOrderListApi,
} from '#/api';

import { formatOrderDateTime, getOrderStatusTagType } from './helper';
import GoodsOrderDetailModal from './modules/goods-order-detail-modal.vue';
import GoodsOrderSendModal from './modules/goods-order-send-modal.vue';
import OrderUserPopover from './modules/order-user-popover.vue';

defineOptions({ name: 'MerchantOrderGoodsPage' });

interface MerchantGoodsOrderTableRow extends MerchantGoodsOrderItem {
  createtime_text: string;
  paytime_text: string;
  receiver_display: string;
  type_display: string;
}

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: GoodsOrderDetailModal,
  destroyOnClose: true,
});

const [SendModal, sendModalApi] = useVbenModal({
  connectedComponent: GoodsOrderSendModal,
  destroyOnClose: true,
});

function getReceiverName(item: MerchantGoodsOrderItem) {
  return item.receiver_name || item.consignee || item.realname || '-';
}

function getOrderTypeText(item: MerchantGoodsOrderItem) {
  return item.type_text || item.type || '-';
}

function openSendModal(row: MerchantGoodsOrderTableRow) {
  sendModalApi.setData({ id: row.id }).open();
}

async function handleFinishOrder(row: MerchantGoodsOrderTableRow) {
  if (!['1', '2'].includes(row.status)) {
    ElMessage.warning('当前订单状态不支持直接完成');
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

  await finishGoodsOrderApi(row.id);
  ElMessage.success('订单已完成');
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantGoodsOrderTableRow;
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
    case 'send': {
      openSendModal(row);
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
          placeholder: '请输入订单号、收货人或手机号',
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
            { label: '待付款', value: '0' },
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
        field: 'user_info',
        minWidth: 180,
        slots: { default: 'user' },
        title: '下单用户',
      },
      {
        field: 'receiver_display',
        minWidth: 120,
        title: '收货人',
      },
      {
        field: 'mobile',
        minWidth: 140,
        title: '手机号',
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '订单状态',
        width: 110,
      },
      {
        field: 'pay_type_text',
        minWidth: 110,
        title: '支付方式',
      },
      {
        field: 'platform_text',
        minWidth: 120,
        title: '平台来源',
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
            nameTitle: '商品订单',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'send',
              show: (row: MerchantGoodsOrderTableRow) => row.status === '1',
              text: '物流发货',
            },
            {
              code: 'finish',
              show: (row: MerchantGoodsOrderTableRow) => ['1', '2'].includes(row.status),
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
    cellConfig: {
      height: 75,
    },
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const dateRange = formValues.date_range || [];
          const response = await getGoodsOrderListApi({
            date_from: Array.isArray(dateRange) ? dateRange[0] : '',
            date_to: Array.isArray(dateRange) ? dateRange[1] : '',
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
          });

          return {
            items: response.list.map((item): MerchantGoodsOrderTableRow => ({
              ...item,
              createtime_text: formatOrderDateTime(item.createtime),
              paytime_text: formatOrderDateTime(item.paytime),
              receiver_display: getReceiverName(item),
              type_display: getOrderTypeText(item),
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
  } as VxeTableGridOptions<MerchantGoodsOrderTableRow>,
});
</script>

<template>
  <Page
    auto-content-height
    description="查看当前商家的商品订单，支持按订单状态与下单时间筛选，并在详情里查看收货信息、商品明细和发货记录。"
    title="商品订单"
  >
    <DetailModal />
    <SendModal @success="gridApi.query()" />

    <Grid table-title="商品订单列表">
      <template #toolbar-tools>
        <div class="text-sm text-muted-foreground">
          支持物流发货和完成订单，快递公司来自最新元数据接口。
        </div>
      </template>

      <template #status="{ row }">
        <ElTag :type="getOrderStatusTagType(row.status)" effect="light" round>
          {{ row.status_text || row.status || '-' }}
        </ElTag>
      </template>

      <template #user="{ row }">
        <OrderUserPopover :user-info="row.user_info" />
      </template>
    </Grid>
  </Page>
</template>
