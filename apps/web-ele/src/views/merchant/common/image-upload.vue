<script lang="ts" setup>
import type { UploadProps, UploadRequestOptions } from 'element-plus';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  ElIcon,
  ElImageViewer,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { uploadMerchantImage } from '#/api';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    size?: number;
  }>(),
  {
    modelValue: '',
    size: 108,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const previewVisible = ref(false);

const imageUrl = computed(() => props.modelValue || '');

const handleSuccess: UploadProps['onSuccess'] = (response) => {
  const data = response as { fullurl?: string; url?: string };
  emit('update:modelValue', data.fullurl || data.url || '');
};

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isValidImage = ['image/jpeg', 'image/png', 'image/webp'].includes(
    rawFile.type,
  );
  if (!isValidImage) {
    ElMessage.error('仅支持上传 JPG、PNG、WEBP 格式图片');
    return false;
  }

  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }

  return true;
};

function handleUpload(options: UploadRequestOptions) {
  const uploadFile = options.file as File;

  return uploadMerchantImage({
    file: uploadFile,
    onError: (error) => {
      options.onError(error as any);
    },
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => {
      options.onSuccess(data);
    },
  });
}

function openPreview() {
  if (!imageUrl.value) {
    return;
  }
  previewVisible.value = true;
}

function clearImage() {
  emit('update:modelValue', '');
}
</script>

<template>
  <div
    class="merchant-image-upload"
    :style="{
      '--merchant-image-size': `${size}px`,
    }"
  >
    <ElUpload
      class="merchant-image-upload__uploader"
      :show-file-list="false"
      accept=".png,.jpg,.jpeg,.webp"
      :http-request="handleUpload"
      :on-success="handleSuccess"
      :before-upload="beforeUpload"
    >
      <div v-if="imageUrl" class="merchant-image-upload__image-wrap">
        <img :src="imageUrl" class="merchant-image-upload__image" />

        <div class="merchant-image-upload__mask">
          <button
            class="merchant-image-upload__action"
            type="button"
            @click.stop.prevent="openPreview"
          >
            <IconifyIcon icon="lucide:zoom-in" />
          </button>
          <button
            class="merchant-image-upload__action"
            type="button"
            @click.stop.prevent="clearImage"
          >
            <IconifyIcon icon="lucide:trash-2" />
          </button>
        </div>
      </div>

      <ElIcon v-else class="merchant-image-upload__icon">
        <IconifyIcon icon="lucide:image-plus" />
      </ElIcon>
    </ElUpload>

    <ElImageViewer
      v-if="previewVisible"
      :url-list="imageUrl ? [imageUrl] : []"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped>
.merchant-image-upload {
  display: inline-flex;
}

:deep(.merchant-image-upload__uploader .el-upload) {
  align-items: center;
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  height: var(--merchant-image-size);
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: var(--el-transition-duration-fast);
  width: var(--merchant-image-size);
}

:deep(.merchant-image-upload__uploader .el-upload:hover) {
  border-color: var(--el-color-primary);
}

.merchant-image-upload__image-wrap {
  height: var(--merchant-image-size);
  position: relative;
  width: var(--merchant-image-size);
}

.merchant-image-upload__image {
  display: block;
  height: var(--merchant-image-size);
  object-fit: cover;
  width: var(--merchant-image-size);
}

.merchant-image-upload__mask {
  align-items: center;
  background: rgb(15 23 42 / 58%);
  display: flex;
  gap: 10px;
  height: var(--merchant-image-size);
  inset: 0;
  justify-content: center;
  opacity: 0;
  position: absolute;
  transition: opacity 0.2s ease;
  width: var(--merchant-image-size);
}

.merchant-image-upload__image-wrap:hover .merchant-image-upload__mask {
  opacity: 1;
}

.merchant-image-upload__action {
  align-items: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 16px;
  justify-content: center;
  padding: 0;
}

.merchant-image-upload__icon {
  color: #8c939d;
  font-size: 24px;
}
</style>
