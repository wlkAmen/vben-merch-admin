<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantTicketItem, MerchantTicketMetaResult } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElImage, ElMessage, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTicketListApi, getTicketOptionsApi } from '#/api';

defineOptions({ name: 'MerchantTicketListPage' });

interface MerchantTicketTableRow extends MerchantTicketItem {
  first_image: string;
  updatetime_text: string;
}

const router = useRouter();
const metaRef = ref<MerchantTicketMetaResult | null>(null);

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

async function loadTicketMeta() {
  try {
    metaRef.value = await getTicketOptionsApi();
    gridApi.formApi.updateSchema([
      {
        fieldName: 'status',
        componentProps: {
          allowClear: true,
          options: metaRef.value.status_list,
        },
      },
    ]);
  } catch (error) {
    console.error(error);
    ElMessage.error('门票筛选项加载失败，请稍后重试');
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
          placeholder: '请输入景点名称关键词',
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '景点状态',
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
        minWidth: 360,
        slots: { default: 'title' },
        title: '景点信息',
      },
      {
        field: 'opentime',
        minWidth: 160,
        title: '开放时间',
      },
      {
        field: 'sellpoint',
        minWidth: 220,
        title: '卖点',
      },
      {
        field: 'merchant_suit_count',
        title: '套餐数',
        width: 100,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '景点状态',
        width: 110,
      },
      {
        field: 'mobile',
        minWidth: 160,
        title: '联系电话',
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
            nameTitle: '景点',
            onClick: onActionClick,
          },
          name: 'CellOperation',
          options: [
            {
              code: 'detail',
              text: '详情',
            },
            {
              code: 'suit',
              text: '套餐',
            },
            {
              code: 'price',
              text: '价格库存',
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
    cellConfig: {
      height: 75
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const response = await getTicketListApi({
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
          });

          return {
            items: response.list.map((item): MerchantTicketTableRow => ({
              ...item,
              first_image: item.images?.[0] || '',
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
  } as VxeTableGridOptions<MerchantTicketTableRow>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<MerchantTicketTableRow>) {
  switch (code) {
    case 'detail': {
      router.push(`/ticket/detail/${row.id}`);
      break;
    }
    case 'suit': {
      router.push(`/ticket/suit/${row.id}`);
      break;
    }
    case 'price': {
      router.push(`/ticket/price/${row.id}`);
      break;
    }
    default: {
      break;
    }
  }
}

onMounted(() => {
  loadTicketMeta();
});
</script>

<template>
  <Page
    auto-content-height
    description="景点基础资料由平台统一维护，商家端在这里查看自己可经营的景点，并继续维护套餐与价格库存。"
    title="门票列表"
  >
    <Grid table-title="可经营景点列表">
      <template #toolbar-tools>
        <div class="text-sm text-muted-foreground">
          当前不支持新增或编辑景点主表信息
        </div>
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
              {{ row.desc || row.address || '暂无景点简介' }}
            </div>
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <ElTag
          :type="row.status === 'normal' ? 'success' : 'info'"
          effect="light"
          round
        >
          {{ row.status_text || row.status || '-' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
