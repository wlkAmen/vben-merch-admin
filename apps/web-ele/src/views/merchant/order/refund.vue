<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantRefundItem } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRefundListApi,
  passRefundApi,
  rejectRefundApi,
} from '#/api';

import { formatOrderDateTime, getProcessStatusTagType } from './helper';
import OrderUserPopover from './modules/order-user-popover.vue';
import RefundOrderDetailModal from './modules/refund-order-detail-modal.vue';

defineOptions({ name: 'MerchantOrderRefundPage' });

interface MerchantRefundTableRow extends MerchantRefundItem {
  applicant_display: string;
  createtime_text: string;
  finishtime_text: string;
  order_summary: string;
}

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: RefundOrderDetailModal,
  destroyOnClose: true,
});

function getRefundTypeTagType(type?: string) {
  switch (type) {
    case 'goods': {
      return 'success';
    }
    case 'line': {
      return 'primary';
    }
    case 'ticket': {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
}

function getRefundStatusOptions() {
  return [
    { label: '用户取消', value: '-2' },
    { label: '拒绝', value: '-1' },
    { label: '待处理', value: '0' },
    { label: '申请中', value: '1' },
    { label: '已完成', value: '2' },
  ];
}

function getRefundHandleStatusOptions() {
  return [
    { label: '退款失败', value: '-1' },
    { label: '待处理', value: '0' },
    { label: '退款中', value: '1' },
    { label: '退款完成', value: '2' },
  ];
}

function getApplicantDisplay(item: MerchantRefundItem) {
  const nickname = item.user_info?.nickname || item.user_info?.username || '-';
  const mobile = item.user_info?.mobile || '-';
  return `${nickname} / ${mobile}`;
}

function getOrderSummary(item: MerchantRefundItem) {
  const orderInfo = item.order_info || {};

  if (item.type === 'goods') {
    const title = orderInfo.goods_title || '-';
    const skuText = orderInfo.goods_sku_text || '-';
    return `${title} / ${skuText}`;
  }

  const title = orderInfo.title || '-';
  const suitName = orderInfo.suit_name || '-';
  const date = orderInfo.date || '-';
  return `${title} / ${suitName} / ${date}`;
}

function openDetailById(id: number) {
  detailModalApi.setData({ id }).open();
}

async function onPassRefund(item: MerchantRefundItem) {
  if (!item.can_pass) {
    ElMessage.warning('当前退款单暂不可通过');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定通过退款单“${item.refund_sn}”吗？`,
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

  try {
    await passRefundApi(item.id);
    ElMessage.success('退款已通过');
    gridApi.query();
  } catch (error) {
    console.error(error);
  }
}

async function onRejectRefund(item: MerchantRefundItem) {
  if (!item.can_reject) {
    ElMessage.warning('当前退款单暂不可拒绝');
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

  try {
    await rejectRefundApi({
      id: item.id,
      reject_msg: rejectMsg,
    });
    ElMessage.success('退款已拒绝');
    gridApi.query();
  } catch (error) {
    console.error(error);
  }
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantRefundTableRow;
}) {
  switch (code) {
    case 'detail': {
      openDetailById(row.id);
      break;
    }
    case 'pass': {
      onPassRefund(row);
      break;
    }
    case 'reject': {
      onRejectRefund(row);
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
          placeholder: '退款单号、订单号、备注、拒绝原因、用户昵称/手机号/用户名',
        },
      },
      {
        component: 'Select',
        fieldName: 'type',
        label: '订单类型',
        componentProps: {
          allowClear: true,
          options: [
            { label: '线路', value: 'line' },
            { label: '门票', value: 'ticket' },
            { label: '商品', value: 'goods' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'refund_status',
        label: '售后状态',
        componentProps: {
          allowClear: true,
          options: getRefundStatusOptions(),
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '处理状态',
        componentProps: {
          allowClear: true,
          options: getRefundHandleStatusOptions(),
        },
      },
      {
        component: 'DatePicker',
        fieldName: 'date_range',
        label: '申请时间',
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
        field: 'refund_sn',
        minWidth: 180,
        title: '退款单号',
      },
      {
        field: 'order_sn',
        minWidth: 180,
        title: '原订单号',
      },
      {
        field: 'type',
        slots: { default: 'type' },
        title: '订单类型',
        width: 110,
      },
      {
        field: 'applicant_display',
        minWidth: 220,
        slots: { default: 'applicant' },
        title: '申请用户',
      },
      {
        field: 'order_summary',
        minWidth: 260,
        title: '订单摘要',
      },
      {
        field: 'refund_status',
        slots: { default: 'refundStatus' },
        title: '售后状态',
        width: 120,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '处理状态',
        width: 120,
      },
      {
        field: 'refund_fee',
        title: '退款金额',
        width: 110,
      },
      {
        field: 'pay_fee',
        title: '原支付金额',
        width: 120,
      },
      {
        field: 'createtime_text',
        title: '申请时间',
        width: 180,
      },
      {
        field: 'finishtime_text',
        title: '完成时间',
        width: 180,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'refund_sn',
            nameTitle: '退款订单',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'detail',
              text: '详情',
            },
            {
              code: 'pass',
              text: '通过',
            },
            {
              code: 'reject',
              text: '拒绝',
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: '操作',
        width: 200,
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const dateRange = formValues.date_range || [];
          const response = await getRefundListApi({
            date_from: Array.isArray(dateRange) ? dateRange[0] : '',
            date_to: Array.isArray(dateRange) ? dateRange[1] : '',
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            refund_status: formValues.refund_status,
            status: formValues.status,
            type: formValues.type,
          });

          return {
            items: response.list.map((item): MerchantRefundTableRow => ({
              ...item,
              applicant_display: getApplicantDisplay(item),
              createtime_text: formatOrderDateTime(item.createtime),
              finishtime_text: formatOrderDateTime(item.finishtime),
              order_summary: getOrderSummary(item),
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
  } as VxeTableGridOptions<MerchantRefundTableRow>,
});
</script>

<template>
  <Page
    auto-content-height
    description="查看退款订单，并对待处理退款申请执行通过或拒绝。"
    title="退款订单"
  >
    <DetailModal @success="gridApi.query()" />

    <Grid table-title="退款订单列表">
      <template #toolbar-tools>
        <div class="text-sm text-muted-foreground">

        </div>
      </template>

      <template #type="{ row }">
        <ElTag :type="getRefundTypeTagType(row.type)" effect="plain" round>
          {{ row.type_text || row.type || '-' }}
        </ElTag>
      </template>

      <template #applicant="{ row }">
        <OrderUserPopover :user-info="row.user_info" />
      </template>

      <template #refundStatus="{ row }">
        <ElTag
          :type="getProcessStatusTagType(row.refund_status, row.refund_status_text)"
          effect="light"
          round
        >
          {{ row.refund_status_text || row.refund_status || '-' }}
        </ElTag>
      </template>

      <template #status="{ row }">
        <ElTag
          :type="getProcessStatusTagType(row.status, row.status_text)"
          effect="light"
          round
        >
          {{ row.status_text || row.status || '-' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
