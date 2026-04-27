<script lang="ts" setup>
import type { MerchantLineContractDetail } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElTag,
} from 'element-plus';

import {
  actionLineContractApi,
  getLineContractDetailApi,
} from '#/api';

import { formatOrderDateTime } from '../helper';

defineOptions({ name: 'MerchantLineContractDetailModal' });

const emit = defineEmits<{
  success: [detail: MerchantLineContractDetail];
}>();

const currentDetail = ref<MerchantLineContractDetail | null>(null);
const detailLoading = ref(false);

const contractInfo = computed(() => currentDetail.value?.contract || null);

const actionTextMap: Record<
  'invalid' | 'repeat' | 'repeatInvalid' | 'send',
  string
> = {
  invalid: '作废合同',
  repeat: '重发合同',
  repeatInvalid: '重发作废通知',
  send: '生成合同',
};

async function loadDetail(id: number) {
  detailLoading.value = true;
  currentDetail.value = null;

  try {
    const response = await getLineContractDetailApi(id);
    currentDetail.value = response.detail;
  } catch (error) {
    console.error(error);
    modalApi.close();
  } finally {
    detailLoading.value = false;
  }
}

async function handleContractAction(
  type: 'invalid' | 'repeat' | 'repeatInvalid' | 'send',
) {
  if (!currentDetail.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定执行“${actionTextMap[type]}”吗？`,
      '合同操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  modalApi.lock();
  try {
    const response = await actionLineContractApi({
      id: currentDetail.value.order_id,
      type,
    });
    currentDetail.value = response.detail;
    emit('success', response.detail);
    ElMessage.success(`${actionTextMap[type]}成功`);
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id: number }>();
    modalApi.setState({
      confirmDisabled: true,
      confirmText: '关闭',
      loading: true,
      showCancelButton: false,
      title: '线路合同详情',
    });

    loadDetail(data.id).finally(() => {
      modalApi.setState({
        confirmDisabled: false,
        loading: false,
      });
    });
  },
});
</script>

<template>
  <Modal class="w-full max-w-[1080px]">
    <div v-loading="detailLoading" class="grid min-h-[260px] gap-4">
      <div v-if="currentDetail" class="grid gap-4">
        <div class="rounded-2xl border bg-card p-4 shadow-sm">
          <div class="mb-3 flex flex-wrap items-center gap-3">
            <div class="text-base font-medium">合同状态</div>
            <ElTag
              :type="currentDetail.contract_enabled ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ currentDetail.contract_enabled ? '已开启电子合同' : '未开启电子合同' }}
            </ElTag>
          </div>

          <div class="grid gap-3 lg:grid-cols-4">
            <ElButton
              :disabled="!currentDetail.can_send"
              type="primary"
              @click="handleContractAction('send')"
            >
              生成合同
            </ElButton>
            <ElButton
              :disabled="!currentDetail.can_repeat"
              @click="handleContractAction('repeat')"
            >
              重发合同
            </ElButton>
            <ElButton
              :disabled="!currentDetail.can_invalid"
              type="danger"
              @click="handleContractAction('invalid')"
            >
              作废合同
            </ElButton>
            <ElButton
              :disabled="!currentDetail.can_repeat_invalid"
              @click="handleContractAction('repeatInvalid')"
            >
              重发作废通知
            </ElButton>
          </div>
        </div>

        <div class="rounded-2xl border bg-card p-4 shadow-sm">
          <div class="mb-3 text-base font-medium">订单信息</div>
          <div class="grid gap-3 text-sm lg:grid-cols-2">
            <div>订单号：{{ currentDetail.order_sn || '-' }}</div>
            <div>订单状态：{{ currentDetail.status_text || currentDetail.status || '-' }}</div>
          </div>
        </div>

        <div class="rounded-2xl border bg-card p-4 shadow-sm">
          <div class="mb-3 text-base font-medium">合同信息</div>

          <div v-if="contractInfo" class="grid gap-3 text-sm">
            <div class="grid gap-3 lg:grid-cols-2">
              <div>合同编号：{{ contractInfo.contractNumber || '-' }}</div>
              <div>合同记录 ID：{{ contractInfo.id || '-' }}</div>
              <div>合同状态：{{ contractInfo.state_text || contractInfo.state || '-' }}</div>
              <div>签署状态：{{ contractInfo.signStatus_text || contractInfo.signStatus || '-' }}</div>
              <div>签署时间：{{ contractInfo.signedtime_text || formatOrderDateTime(contractInfo.signedtime || 0) }}</div>
              <div>作废时间：{{ contractInfo.invalidetime_text || formatOrderDateTime(contractInfo.invalidetime || 0) }}</div>
              <div>创建时间：{{ formatOrderDateTime(contractInfo.createtime || 0) }}</div>
              <div>更新时间：{{ formatOrderDateTime(contractInfo.updatetime || 0) }}</div>
            </div>

            <div class="flex flex-wrap gap-3">
              <a
                v-if="contractInfo.fileURL"
                :href="contractInfo.fileURL"
                class="text-primary underline"
                target="_blank"
              >
                查看合同文件
              </a>
              <a
                v-if="contractInfo.signingURL"
                :href="contractInfo.signingURL"
                class="text-primary underline"
                target="_blank"
              >
                打开签署链接
              </a>
              <a
                v-if="contractInfo.QRCodeURL"
                :href="contractInfo.QRCodeURL"
                class="text-primary underline"
                target="_blank"
              >
                打开二维码链接
              </a>
            </div>

            <div v-if="contractInfo.error_message" class="rounded-xl border border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)] px-4 py-3 text-sm text-muted-foreground">
              错误信息：{{ contractInfo.error_message }}
            </div>

            <div v-if="contractInfo.content" class="rounded-xl border bg-muted/20 p-4">
              <div class="mb-2 text-sm font-medium">合同内容</div>
              <div class="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {{ contractInfo.content }}
              </div>
            </div>
          </div>

          <div v-else class="rounded-xl border p-4 text-sm text-muted-foreground">
            当前还没有生成合同。
          </div>
        </div>
      </div>
    </div>

    <template #prepend-footer>
      <div class="text-xs text-muted-foreground">
        线路合同操作会基于后台权限和当前状态动态放行，按钮是否可点击以接口返回为准。
      </div>
    </template>
  </Modal>
</template>
