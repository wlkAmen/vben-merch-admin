<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantLineOrderItem } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { finishLineOrderApi, getLineOrderListApi } from '#/api';

import { formatOrderDateTime, getOrderStatusTagType } from './helper';
import LineContractDetailModal from './modules/line-contract-detail-modal.vue';
import LineOrderDetailModal from './modules/line-order-detail-modal.vue';
import OrderPayModal from './modules/order-pay-modal.vue';
import OrderUserPopover from './modules/order-user-popover.vue';

defineOptions({ name: 'MerchantOrderLinePage' });

interface MerchantLineOrderTableRow extends MerchantLineOrderItem {
  createtime_text: string;
  paytime_text: string;
}

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: LineOrderDetailModal,
  destroyOnClose: true,
});

const [ContractModal, contractModalApi] = useVbenModal({
  connectedComponent: LineContractDetailModal,
  destroyOnClose: true,
});

const [PayModal, payModalApi] = useVbenModal({
  connectedComponent: OrderPayModal,
  destroyOnClose: true,
});

async function handlePayOrder(row: MerchantLineOrderTableRow) {
  if (row.status !== '0') {
    ElMessage.warning('当前订单不是待支付状态');
    return;
  }

  payModalApi
    .setData({
      id: row.id,
      orderSn: row.order_sn,
      type: 'line',
    })
    .open();
}

async function handleFinishOrder(row: MerchantLineOrderTableRow) {
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

  await finishLineOrderApi(row.id);
  ElMessage.success('订单已完成');
  gridApi.query();
}

function handleOpenContract(row: MerchantLineOrderTableRow) {
  contractModalApi.setData({ id: row.id }).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantLineOrderTableRow;
}) {
  switch (code) {
    case 'contract': {
      handleOpenContract(row);
      break;
    }
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
        field: 'line_title',
        minWidth: 220,
        title: '线路',
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
            nameTitle: '线路订单',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'pay',
              show: (row: MerchantLineOrderTableRow) => row.status === '0',
              text: '确认支付',
            },
            {
              code: 'finish',
              show: (row: MerchantLineOrderTableRow) => row.status === '1',
              text: '完成订单',
            },
            {
              code: 'contract',
              text: '合同',
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
        width: 260,
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
          const response = await getLineOrderListApi({
            date_from: Array.isArray(dateRange) ? dateRange[0] : '',
            date_to: Array.isArray(dateRange) ? dateRange[1] : '',
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
          });

          return {
            items: response.list.map(
              (item): MerchantLineOrderTableRow => ({
                ...item,
                createtime_text: formatOrderDateTime(item.createtime),
                paytime_text: formatOrderDateTime(item.paytime),
              }),
            ),
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
  } as VxeTableGridOptions<MerchantLineOrderTableRow>,
});
</script>

<template>
  <Page
    auto-content-height
    description="查看当前商家的线路订单，支持按关键词、订单状态和下单时间筛选，并在详情弹窗中完成支付、合同和订单处理。"
    title="线路订单"
  >
    <DetailModal @success="gridApi.query()" />
    <ContractModal @success="gridApi.query()" />
    <PayModal @success="gridApi.query()" />

    <Grid table-title="线路订单列表">
      <template #toolbar-tools>
        <div class="text-sm text-muted-foreground">
          支持按状态执行确认支付、完成订单和查看电子合同。
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
