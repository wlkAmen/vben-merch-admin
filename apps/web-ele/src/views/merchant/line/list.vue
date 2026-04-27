<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MerchantLineMetaResult } from '#/api';
import type { MerchantLineTableRow } from './data';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  ElButton,
  ElImage,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElTooltip,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLineApi,
  getLineListApi,
  getLineOptionsApi,
  toggleLineStatusApi,
} from '#/api';

import { useColumns, useGridFormSchema } from './data';

defineOptions({ name: 'MerchantLineListPage' });

const router = useRouter();
const metaRef = ref<MerchantLineMetaResult | null>(null);

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

async function loadLineMeta() {
  try {
    metaRef.value = await getLineOptionsApi();
    gridApi.formApi.updateSchema([
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
          options: metaRef.value.audit_status_list || [],
        },
      },
      {
        fieldName: 'type',
        componentProps: {
          allowClear: true,
          options: metaRef.value.type_list,
        },
      },
    ]);
  } catch (error) {
    console.error(error);
    ElMessage.error('线路筛选项加载失败，请稍后重试');
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    cellConfig: {
      height: 75
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const response = await getLineListApi({
            audit_status: formValues.audit_status,
            keyword: formValues.keyword,
            page: page.currentPage,
            page_size: page.pageSize,
            status: formValues.status,
            type: formValues.type,
          });

          const items: MerchantLineTableRow[] = response.list.map((item) => ({
            ...item,
            createtime_text: formatDateTime(item.createtime),
            first_image: item.images?.[0] || item.poster || '',
            itinerary_text: `${item.lineday}天${item.linenight}晚`,
          }));

          return {
            items,
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
  } as VxeTableGridOptions<MerchantLineTableRow>,
});

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  router.push('/line/create');
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: MerchantLineTableRow;
}) {
  switch (code) {
    case 'detail': {
      router.push(`/line/detail/${row.id}`);
      break;
    }
    case 'edit': {
      router.push(`/line/edit/${row.id}`);
      break;
    }
    case 'suit': {
      router.push(`/line/suit/${row.id}`);
      break;
    }
    case 'price': {
      router.push(`/line/price/${row.id}`);
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

async function onStatusChange(newStatus: string, row: MerchantLineTableRow) {
  const nextStatusText = newStatus === '1' ? '上架' : '下架';

  if (newStatus === '1' && String(row.audit_status) !== '1') {
    ElMessage.warning(
      row.audit_status === '2'
        ? '当前线路审核已驳回，请先根据驳回原因修改内容并重新提交审核'
        : '当前线路尚未审核通过，暂时不能上架',
    );
    return false;
  }

  try {
    await ElMessageBox.confirm(
      `确定将线路“${row.title}”切换为${nextStatusText}状态吗？`,
      '切换状态',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await toggleLineStatusApi({
      id: row.id,
      status: newStatus,
    });

    ElMessage.success(`线路已切换为${nextStatusText}`);
    return true;
  } catch {
    return false;
  }
}

async function onDelete(row: MerchantLineTableRow) {
  try {
    await deleteLineApi(row.id);
    ElMessage.success('线路已删除');
    onRefresh();
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  loadLineMeta();
});
</script>

<template>
  <Page
    auto-content-height
  >
    <Grid table-title="线路列表">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增线路
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
              {{ row.desc || '暂无线路简介' }}
            </div>
          </div>
        </div>
      </template>

      <template #type="{ row }">
        <div>
          <ElTag effect="plain" round>
            {{ row.type_text || row.type || '-' }}
          </ElTag>
        </div>
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

      <template #config="{ row }">
        <div>
          <ElTag
            v-if="row.suit_count > 0"
            effect="light"
            round
            type="success"
          >
            已配置套餐
          </ElTag>

          <ElButton
            v-else
            link
            type="primary"
            @click="router.push(`/line/suit/${row.id}`)"
          >
            去配置套餐
          </ElButton>
        </div>
      </template>
    </Grid>
  </Page>
</template>
