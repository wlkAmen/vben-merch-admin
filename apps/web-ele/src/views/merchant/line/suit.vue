<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  MerchantLineDetail,
  MerchantLineSuitItem,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLineSuitApi,
  getLineDetailApi,
  getLineSuitListApi,
} from '#/api';

import SuitFormDrawer from './modules/suit-form.vue';

defineOptions({ name: 'MerchantLineSuitPage' });

const route = useRoute();
const router = useRouter();

const lineDetail = ref<MerchantLineDetail | null>(null);
const lineId = computed(() => Number(route.params.id || 0));

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: SuitFormDrawer,
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
          placeholder: '请输入套餐名称关键词',
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
        field: 'price',
        title: '原始价格',
        width: 120,
      },
      {
        field: 'person',
        title: '成人标准',
        minWidth: 140,
      },
      {
        field: 'child',
        title: '儿童标准',
        minWidth: 140,
      },
      {
        field: 'room',
        title: '单房差',
        minWidth: 120,
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
            nameTitle: '套餐',
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
          const response = await getLineSuitListApi({
            keyword: formValues.keyword,
            line_id: lineId.value,
            page: page.currentPage,
            page_size: page.pageSize,
          });

          return {
            items: response.list.map((item: MerchantLineSuitItem) => ({
              ...item,
              updatetime_text: item.updatetime
                ? new Intl.DateTimeFormat('zh-CN', {
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(item.updatetime * 1000))
                : '-',
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
  } as VxeTableGridOptions<MerchantLineSuitItem>,
});

function onRefresh() {
  gridApi.query();
}

function handleSuitSuccess(payload?: {
  created: boolean;
  detail: MerchantLineSuitItem | null;
}) {
  onRefresh();

  if (payload?.created && payload.detail?.id) {
    router.push({
      path: `/line/price/${lineId.value}`,
      query: { suitId: String(payload.detail.id) },
    });
  }
}

async function loadLineDetail() {
  if (!lineId.value) {
    return;
  }
  const response = await getLineDetailApi(lineId.value);
  lineDetail.value = response.detail;
}

function onCreate() {
  formDrawerApi
    .setData({
      lineId: lineId.value,
    })
    .open();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<MerchantLineSuitItem>) {
  switch (code) {
    case 'edit': {
      formDrawerApi
        .setData({
          id: row.id,
          lineId: lineId.value,
        })
        .open();
      break;
    }
    case 'price': {
      router.push({
        path: `/line/price/${lineId.value}`,
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

async function onDelete(row: MerchantLineSuitItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除套餐“${row.name}”吗？`,
      '删除套餐',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await deleteLineSuitApi(row.id);
    ElMessage.success('套餐已删除');
    onRefresh();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
    }
  }
}

onMounted(() => {
  loadLineDetail();
});
</script>

<template>
  <Page
    auto-content-height
    :description="lineDetail?.title || '维护当前线路下的套餐信息与价格日历。'"
    title="线路套餐管理"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push(`/line/detail/${lineId}`)">返回详情</ElButton>
        <ElButton type="primary" plain @click="router.push(`/line/price/${lineId}`)">
          价格库存页
        </ElButton>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增套餐
        </ElButton>
      </div>
    </template>

    <FormDrawer @success="handleSuitSuccess" />

    <Grid table-title="线路套餐列表" />
  </Page>
</template>
