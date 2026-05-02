<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantVerifyItem } from '#/api';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTicketVerifyListApi, useTicketVerifyApi } from '#/api';

import OrderUserPopover from '../order/modules/order-user-popover.vue';
import VerifyDetailModal from './modules/verify-detail-modal.vue';

defineOptions({ name: 'MerchantVerifyRecordsPage' });

const usingVerify = ref(false);

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: VerifyDetailModal,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'keyword',
        label: '关键词',
        componentProps: {
          placeholder: '请输入核销码、订单号、联系人或手机号',
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '核销状态',
        componentProps: {
          allowClear: true,
          options: [
            { label: '待核销', value: '0' },
            { label: '已核销', value: '1' },
          ],
        },
      },
    ],
    submitOnChange: true,
  },
  gridOptions: {
    columns: [
      {
        field: 'code',
        minWidth: 180,
        title: '核销码',
      },
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
        field: 'date',
        minWidth: 120,
        title: '出游日期',
      },
      {
        field: 'number',
        title: '数量',
        width: 90,
      },
      {
        field: 'total_fee',
        title: '订单金额',
        width: 110,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '核销状态',
        width: 110,
      },
      {
        field: 'verifytime_text',
        title: '核销时间',
        width: 180,
      },
      {
        field: 'createtime_text',
        title: '发放时间',
        width: 180,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'code',
            nameTitle: '核销记录',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'detail',
              text: '详情',
            },
            {
              code: 'use',
              text: '核销',
            },
          ],
        },
        field: 'operation',
        fixed: 'right',
        title: '操作',
        width: 160,
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
          const response = await getTicketVerifyListApi({
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
          });

          return {
            items: response.list,
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
  } as VxeTableGridOptions<MerchantVerifyItem>,
});

function openDetailById(id: number) {
  detailModalApi.setData({ id }).open();
}

async function onUseVerify(item: { code: string; id: number; status: string }) {
  if (item.status !== '0') {
    ElMessage.warning('当前记录已核销，无需重复操作');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定核销核销码“${item.code}”吗？`, '执行核销', {
      confirmButtonText: '确定核销',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  usingVerify.value = true;
  try {
    await useTicketVerifyApi({ id: item.id });
    ElMessage.success('核销成功');
    gridApi.query();
  } catch (error) {
    console.error(error);
  } finally {
    usingVerify.value = false;
  }
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantVerifyItem;
}) {
  switch (code) {
    case 'detail': {
      openDetailById(row.id);
      break;
    }
    case 'use': {
      onUseVerify(row);
      break;
    }
    default: {
      break;
    }
  }
}
</script>

<template>
  <Page
    auto-content-height
    description="查看当前商家的门票核销记录，并支持从待核销记录直接完成核销。"
    title="核销记录"
  >
    <DetailModal @success="gridApi.query()" />

    <Grid table-title="门票核销记录">
      <template #status="{ row }">
        <ElTag
          :type="row.status === '1' ? 'success' : 'warning'"
          effect="light"
          round
        >
          {{ row.status_text || row.status || '-' }}
        </ElTag>
      </template>

      <template #user="{ row }">
        <OrderUserPopover :user-info="row.user_info" />
      </template>
    </Grid>
  </Page>
</template>
