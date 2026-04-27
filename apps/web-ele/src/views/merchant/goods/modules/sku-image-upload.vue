<script lang="ts" setup>
import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import type { UploadProps, UploadRequestOptions } from 'element-plus';

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
  }>(),
  {
    modelValue: '',
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
  <div class="goods-sku-image-upload">
    <ElUpload
      class="goods-sku-image-upload__uploader"
      :show-file-list="false"
      accept=".png,.jpg,.jpeg,.webp"
      :http-request="handleUpload"
      :on-success="handleSuccess"
      :before-upload="beforeUpload"
    >
      <div v-if="imageUrl" class="goods-sku-image-upload__image-wrap">
        <img :src="imageUrl" class="goods-sku-image-upload__image" />

        <div class="goods-sku-image-upload__mask">
          <button
            class="goods-sku-image-upload__action"
            type="button"
            @click.stop.prevent="openPreview"
          >
            <IconifyIcon icon="lucide:zoom-in" />
          </button>
          <button
            class="goods-sku-image-upload__action"
            type="button"
            @click.stop.prevent="clearImage"
          >
            <IconifyIcon icon="lucide:trash-2" />
          </button>
        </div>
      </div>

      <ElIcon v-else class="goods-sku-image-upload__icon">
        <IconifyIcon icon="lucide:plus" />
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
.goods-sku-image-upload {
  display: inline-flex;
}

:deep(.goods-sku-image-upload__uploader .el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  height: 56px;
  overflow: hidden;
  position: relative;
  transition: var(--el-transition-duration-fast);
  width: 56px;
}

:deep(.goods-sku-image-upload__uploader .el-upload:hover) {
  border-color: var(--el-color-primary);
}

.goods-sku-image-upload__image-wrap {
  height: 56px;
  position: relative;
  width: 56px;
}

.goods-sku-image-upload__image {
  display: block;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.goods-sku-image-upload__mask {
  align-items: center;
  background: rgb(15 23 42 / 58%);
  display: flex;
  gap: 6px;
  height: 56px;
  inset: 0;
  justify-content: center;
  opacity: 0;
  position: absolute;
  transition: opacity 0.2s ease;
  width: 56px;
}

.goods-sku-image-upload__image-wrap:hover .goods-sku-image-upload__mask {
  opacity: 1;
}

.goods-sku-image-upload__action {
  align-items: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  justify-content: center;
  padding: 0;
}

.goods-sku-image-upload__icon {
  color: #8c939d;
  font-size: 18px;
  height: 56px;
  text-align: center;
  width: 56px;
}
</style>
