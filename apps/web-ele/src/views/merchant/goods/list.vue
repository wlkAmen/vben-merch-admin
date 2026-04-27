<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantGoodsItem, MerchantGoodsMetaResult } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElImage,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElTooltip,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getGoodsListApi,
  getGoodsOptionsApi,
  toggleGoodsStatusApi,
} from '#/api';

defineOptions({ name: 'MerchantGoodsListPage' });

interface MerchantGoodsTableRow extends MerchantGoodsItem {
  first_image: string;
  updatetime_text: string;
}

const router = useRouter();
const metaRef = ref<MerchantGoodsMetaResult | null>(null);

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

function getTypeTagType(type: string) {
  switch (type) {
    case 'card': {
      return 'warning';
    }
    case 'virtual': {
      return 'success';
    }
    default: {
      return 'info';
    }
  }
}

function getStatusTagType(status: string) {
  switch (status) {
    case 'up': {
      return 'success';
    }
    case 'hidden': {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
}

function getStatusLabel(status: string) {
  return metaRef.value?.status_list.find((item) => item.value === status)?.label || status;
}

async function loadGoodsMeta() {
  try {
    metaRef.value = await getGoodsOptionsApi();
    gridApi.formApi.updateSchema([
      {
        fieldName: 'type',
        componentProps: {
          allowClear: true,
          options: metaRef.value.type_list,
        },
      },
      {
        fieldName: 'status',
        componentProps: {
          allowClear: true,
          options: metaRef.value.status_list,
        },
      },
      {
        fieldName: 'audit_status',
        componentProps: {
          allowClear: true,
          options:
            metaRef.value.audit_status_list || [
              { label: '待审核', value: '0' },
              { label: '审核通过', value: '1' },
              { label: '驳回', value: '2' },
            ],
        },
      },
    ]);
  } catch (error) {
    console.error(error);
    ElMessage.error('商品筛选项加载失败，请稍后重试');
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
          placeholder: '请输入商品标题关键词',
        },
      },
      {
        component: 'Select',
        fieldName: 'type',
        label: '商品类型',
        componentProps: {
          allowClear: true,
          options: [],
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '上下架',
        componentProps: {
          allowClear: true,
          options: [],
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
        field: 'title',
        fixed: 'left',
        minWidth: 340,
        slots: { default: 'title' },
        title: '商品信息',
      },
      {
        field: 'type',
        slots: { default: 'type' },
        title: '商品类型',
        width: 120,
      },
      {
        field: 'price',
        title: '销售价',
        width: 110,
      },
      {
        field: 'stock',
        title: '库存',
        width: 100,
      },
      {
        field: 'is_sku',
        slots: { default: 'skuMode' },
        title: '规格模式',
        width: 110,
      },
      {
        field: 'audit_status',
        slots: { default: 'auditStatus' },
        title: '审核状态',
        width: 120,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '上下架',
        width: 110,
      },
      {
        field: 'sales',
        title: '销量',
        width: 90,
      },
      {
        field: 'updatetime_text',
        title: '更新时间',
        width: 180,
      },
      {
        align: 'center',
        cellRender: {
          attrs: {
            nameField: 'title',
            nameTitle: '商品',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'detail',
              text: '详情',
            },
            {
              code: 'edit',
              text: '编辑',
            },
            {
              code: 'sku',
              text: 'SKU',
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
    cellConfig: {
      height: 75
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const response = await getGoodsListApi({
            audit_status: formValues.audit_status,
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
            type: formValues.type,
          });

          return {
            items: response.list.map((item): MerchantGoodsTableRow => ({
              ...item,
              first_image: item.image || item.images?.[0] || '',
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
  } as VxeTableGridOptions<MerchantGoodsTableRow>,
});

function onCreate() {
  router.push('/goods/create');
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantGoodsTableRow;
}) {
  switch (code) {
    case 'detail': {
      router.push(`/goods/detail/${row.id}`);
      break;
    }
    case 'edit': {
      router.push(`/goods/edit/${row.id}`);
      break;
    }
    case 'sku': {
      router.push(`/goods/sku/${row.id}`);
      break;
    }
    default: {
      break;
    }
  }
}

async function onStatusCommand(newStatus: string, row: MerchantGoodsTableRow) {
  const nextStatusText = getStatusLabel(newStatus);

  if (newStatus === 'up' && String(row.audit_status) !== '1') {
    ElMessage.warning(
      row.audit_status === '2'
        ? '当前商品审核已驳回，请先修改内容并重新提交审核'
        : '当前商品尚未审核通过，暂时不能上架',
    );
    return false;
  }

  if (newStatus === row.status) {
    return true;
  }

  try {
    await ElMessageBox.confirm(
      `确定将商品“${row.title}”切换为${nextStatusText}状态吗？`,
      '切换状态',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await toggleGoodsStatusApi({
      id: row.id,
      status: newStatus,
    });

    ElMessage.success(`商品已切换为${nextStatusText}`);
    return true;
  } catch {
    return false;
  }
}

onMounted(() => {
  loadGoodsMeta();
});
</script>

<template>
  <Page
    auto-content-height
    description="商品内容走审核流，审核通过后才允许重新上架。"
    title="商品列表"
  >
    <Grid table-title="商品列表">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增商品
        </ElButton>
      </template>

      <template #title="{ row }">
        <div class="flex items-center gap-3">
          <ElImage
            v-if="row.first_image"
            :preview-src-list="row.images"
            :src="row.first_image"
            class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border"
            fit="cover"
            preview-teleported
          />
          <div class="min-w-0 space-y-1 text-left">
            <div class="truncate font-medium text-foreground">
              {{ row.title }}
            </div>
            <div class="text-muted-foreground line-clamp-2 text-xs leading-5">
              {{ row.subtitle || '暂无商品副标题' }}
            </div>
          </div>
        </div>
      </template>

      <template #type="{ row }">
        <ElTag :type="getTypeTagType(row.type)" effect="plain" round>
          {{ row.type_text || row.type || '-' }}
        </ElTag>
      </template>

      <template #skuMode="{ row }">
        <ElTag :type="row.is_sku === 1 ? 'warning' : 'success'" effect="plain" round>
          {{ row.is_sku === 1 ? '多规格' : '单规格' }}
        </ElTag>
      </template>

      <template #status="{ row }">
        <ElDropdown
          trigger="click"
          @command="(status) => onStatusCommand(String(status), row)"
        >
          <ElTag :type="getStatusTagType(row.status)" effect="light" round>
            {{ row.status_text || getStatusLabel(row.status) || row.status || '-' }}
          </ElTag>

          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                v-for="item in metaRef?.status_list || []"
                :key="item.value"
                :command="item.value"
                :disabled="item.value === row.status"
              >
                {{ item.label }}
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </template>

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
          :type="
            row.audit_status === '1'
              ? 'success'
              : row.audit_status === '2'
                ? 'danger'
                : 'warning'
          "
          effect="light"
          round
        >
          {{ row.audit_status_text || row.audit_status || '-' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
