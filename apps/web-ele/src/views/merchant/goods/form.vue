<script lang="ts" setup>
import type {
  MerchantGoodsDetail,
  MerchantGoodsMetaResult,
  MerchantGoodsParamItem,
  MerchantGoodsSkuPayload,
  MerchantUploadResult,
} from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AnalysisChartCard, Page } from '@vben/common-ui';
import { VbenTiptap } from '@vben/plugins/tiptap';

import type {
  FormInstance,
  FormRules,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';

import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElImageViewer,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElStep,
  ElSteps,
  ElTag,
  ElTreeSelect,
  ElUpload,
} from 'element-plus';

import {
  createGoodsApi,
  getGoodsDetailApi,
  getGoodsOptionsApi,
  saveGoodsSkuApi,
  updateGoodsApi,
  uploadMerchantImage,
} from '#/api';
import GoodsSkuImageUpload from './modules/sku-image-upload.vue';
import type { GoodsSkuEditorRow, GoodsSpecGroup } from './sku-helper';
import {
  applyGoodsSkuBatchFill,
  createEmptyGoodsSpecGroup,
  createEmptyGoodsSpecValue,
  createGoodsSkuBatchFillForm,
  normalizeGoodsSpecData,
  serializeGoodsSkuGroups,
  serializeGoodsSkuRows,
  syncGoodsSkuRows,
  validateGoodsSkuRows,
  validateGoodsSpecGroups,
} from './sku-helper';

defineOptions({ name: 'MerchantGoodsFormPage' });

interface GoodsTreeOption {
  children?: GoodsTreeOption[];
  label: string;
  value: number;
}

interface GoodsEditState {
  category_ids: number[];
  content: string;
  dispatch_id?: number;
  dispatch_type: string;
  image: string;
  images: string[];
  is_sku: number;
  original_price: number | string;
  params: MerchantGoodsParamItem[];
  price: number | string;
  sn: string;
  stock?: number;
  subtitle: string;
  title: string;
  type: string;
  weight: number | string;
}

type GoodsEditStepKey = 'basic' | 'price' | 'detail';

const route = useRoute();
const router = useRouter();

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const metaRef = ref<MerchantGoodsMetaResult | null>(null);
const currentStep = ref(0);
const imagePreviewVisible = ref(false);
const imagePreviewIndex = ref(0);
const imagePreviewUrls = ref<string[]>([]);
const mainImageFiles = ref<UploadUserFile[]>([]);
const carouselFiles = ref<UploadUserFile[]>([]);
const specGroups = ref<GoodsSpecGroup[]>([]);
const skuRows = ref<GoodsSkuEditorRow[]>([]);
const seed = ref(1);
const skuBatchFillForm = reactive(createGoodsSkuBatchFillForm());
const auditInfo = ref<null | Pick<
  MerchantGoodsDetail,
  | 'audit_remark'
  | 'audit_status'
  | 'audit_status_text'
  | 'status'
  | 'status_text'
>>(null);

const goodsId = computed(() => Number(route.params.id || 0));
const isEdit = computed(() => !!goodsId.value);

const form = reactive<GoodsEditState>({
  category_ids: [],
  content: '',
  dispatch_id: undefined,
  dispatch_type: 'express',
  image: '',
  images: [],
  is_sku: 0,
  original_price: '',
  params: [],
  price: '',
  sn: '',
  stock: undefined,
  subtitle: '',
  title: '',
  type: 'normal',
  weight: '',
});

const stepItems = [
  { key: 'basic', label: '基础信息' },
  { key: 'price', label: '规格与价格' },
  { key: 'detail', label: '商品详情' },
] satisfies Array<{ key: GoodsEditStepKey; label: string }>;

const currentStepItem = computed(() => stepItems[currentStep.value]);
const currentStepKey = computed<GoodsEditStepKey>(() => currentStepItem.value?.key || 'basic');

const categoryOptions = computed<GoodsTreeOption[]>(() => {
  const normalize = (items: Array<Record<string, any>> = []): GoodsTreeOption[] =>
    items.map((item) => ({
      children: item.children ? normalize(item.children) : undefined,
      label: String(item.name || ''),
      value: Number(item.id),
    }));
  return normalize(metaRef.value?.category_options || []);
});

const dispatchTypeOptions = computed(() => {
  const types = new Map<string, string>();
  (metaRef.value?.dispatch_options || []).forEach((item) => {
    types.set(item.type, item.type_text);
  });
  return [...types.entries()].map(([value, label]) => ({ label, value }));
});

const filteredDispatchOptions = computed(() => {
  return (metaRef.value?.dispatch_options || []).filter(
    (item) => item.type === form.dispatch_type,
  );
});

const isMultipleSku = computed(() => form.is_sku === 1);

const auditNotice = computed(() => {
  if (!isEdit.value || !auditInfo.value) {
    return null;
  }
  if (auditInfo.value.audit_status === '2') {
    return {
      className:
        'border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)]',
      text: auditInfo.value.audit_remark
        ? `当前商品审核已驳回：${auditInfo.value.audit_remark}。请修改后重新提交审核。`
        : '当前商品审核已驳回，请修改内容后重新提交审核。',
    };
  }
  if (auditInfo.value.audit_status === '0') {
    return {
      className:
        'border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)]',
      text: '当前商品处于待审核状态，平台审核通过后才会上架；本页保存后会继续保持待审核。',
    };
  }
  return {
    className:
      'border-[var(--el-color-success-light-5)] bg-[var(--el-color-success-light-9)]',
    text: '当前商品已审核通过。若你在本页保存商品内容，系统会重新提交平台审核。',
  };
});

const rules: FormRules<GoodsEditState> = {
  category_ids: [{ message: '请选择商品分类', required: true, trigger: 'change', type: 'array' }],
  dispatch_id: [{ message: '请选择发货模板', required: true, trigger: 'change' }],
  original_price: [{ message: '请输入原价', required: true, trigger: 'blur' }],
  price: [{ message: '请输入销售价', required: true, trigger: 'blur' }],
  subtitle: [{ message: '请输入商品副标题', required: true, trigger: 'blur' }],
  title: [{ message: '请输入商品标题', required: true, trigger: 'blur' }],
  type: [{ message: '请选择商品类型', required: true, trigger: 'change' }],
};

function createUploadFile(url: string, name?: string): UploadUserFile {
  const normalizedUrl = url || '';
  return {
    name: name || normalizedUrl.split('/').pop() || '文件',
    status: 'success',
    uid: Date.now() + Math.floor(Math.random() * 1000),
    url: normalizedUrl,
  };
}

function createUploadedUserFile(data: MerchantUploadResult, file: File): UploadUserFile {
  return {
    name: file.name,
    response: data,
    status: 'success',
    uid: Date.now() + Math.floor(Math.random() * 1000),
    url: data.fullurl || data.url,
  };
}

function getUploadedUrl(file?: UploadUserFile) {
  if (!file) {
    return '';
  }
  const response = file.response as MerchantUploadResult | undefined;
  return response?.fullurl || response?.url || file.url || '';
}

function getUploadedUrls(files: UploadUserFile[]) {
  return files.map((file) => getUploadedUrl(file)).filter(Boolean);
}

function beforeImageUpload(rawFile: File) {
  const isValidImage = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type);
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
}

function handleMainImageUpload(options: UploadRequestOptions) {
  const uploadFile = options.file as File;
  return uploadMerchantImage({
    file: uploadFile,
    onError: (error) => options.onError(error as any),
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => {
      mainImageFiles.value = [createUploadedUserFile(data, uploadFile)];
      options.onSuccess(data);
    },
  });
}

function handleCarouselUpload(options: UploadRequestOptions) {
  const uploadFile = options.file as File;
  return uploadMerchantImage({
    file: uploadFile,
    onError: (error) => options.onError(error as any),
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => {
      carouselFiles.value = [
        ...carouselFiles.value,
        createUploadedUserFile(data, uploadFile),
      ];
      options.onSuccess(data);
    },
  });
}

function onMainImageExceed() {
  ElMessage.warning('商品主图仅支持上传 1 张图片');
}

function removeMainImage() {
  mainImageFiles.value = [];
}

function openImagePreview(file: UploadUserFile, fileList: UploadUserFile[] = []) {
  imagePreviewUrls.value = getUploadedUrls(fileList);
  imagePreviewIndex.value = Math.max(
    0,
    fileList.findIndex((item) => item.uid === file.uid),
  );
  imagePreviewVisible.value = true;
}

function closeImagePreview() {
  imagePreviewVisible.value = false;
}

function appendParamItem() {
  form.params.push({ content: '', title: '' });
}

function removeParamItem(index: number) {
  form.params.splice(index, 1);
}

function createSeed() {
  const current = seed.value;
  seed.value += 1;
  return current;
}

function addSpecGroup() {
  specGroups.value.push(createEmptyGoodsSpecGroup(createSeed()));
}

function removeSpecGroup(index: number) {
  specGroups.value.splice(index, 1);
}

function addSpecValue(groupIndex: number) {
  specGroups.value[groupIndex]?.values.push(createEmptyGoodsSpecValue(createSeed()));
}

function removeSpecValue(groupIndex: number, valueIndex: number) {
  specGroups.value[groupIndex]?.values.splice(valueIndex, 1);
}

function syncRowsFromGroups() {
  const normalizedGroups = specGroups.value.map((group) => ({
    ...group,
    values: group.values.filter((value) => value.name.trim()),
  }));
  skuRows.value = syncGoodsSkuRows(normalizedGroups, skuRows.value);
}

function getCombinationKey(row: GoodsSkuEditorRow) {
  return row.goods_sku_text.join(' / ');
}

function handleApplyBatchFillToSkuRows() {
  try {
    skuRows.value = applyGoodsSkuBatchFill(skuRows.value, skuBatchFillForm);
    ElMessage.success(`已批量填充 ${skuRows.value.length} 条规格记录`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '批量填充失败');
  }
}

function resetSkuBatchFillForm() {
  skuBatchFillForm.cost_price = '';
  skuBatchFillForm.original_price = '';
  skuBatchFillForm.price = '';
  skuBatchFillForm.stock = undefined;
}

function resetFormState() {
  auditInfo.value = null;
  mainImageFiles.value = [];
  carouselFiles.value = [];
  specGroups.value = [];
  skuRows.value = [];
  seed.value = 1;
  resetSkuBatchFillForm();
  form.category_ids = [];
  form.content = '';
  form.dispatch_id = undefined;
  form.dispatch_type = 'express';
  form.image = '';
  form.images = [];
  form.is_sku = 0;
  form.original_price = '';
  form.params = [];
  form.price = '';
  form.sn = '';
  form.stock = undefined;
  form.subtitle = '';
  form.title = '';
  form.type = 'normal';
  form.weight = '';
}

function normalizeDetail(detail: MerchantGoodsDetail, skuPayload?: MerchantGoodsSkuPayload | null) {
  form.category_ids = (detail.category_ids || []).map((item) => Number(item));
  form.content = detail.content || '';
  form.dispatch_id = detail.dispatch_id || undefined;
  form.dispatch_type = detail.dispatch_type || 'express';
  form.is_sku = detail.is_sku || 0;
  form.original_price = detail.original_price || '';
  form.params = (detail.params || []).map((item) => ({
    content: item.content || '',
    title: item.title || '',
  }));
  form.price = detail.price || '';
  form.subtitle = detail.subtitle || '';
  form.title = detail.title || '';
  form.type = detail.type || 'normal';
  if (detail.is_sku === 0 && skuPayload?.detail) {
    form.stock = skuPayload.detail.stock;
    form.sn = skuPayload.detail.sn || '';
    form.weight = skuPayload.detail.weight || '';
  } else if (detail.is_sku === 1) {
    const normalized = normalizeGoodsSpecData(
      skuPayload?.list || [],
      skuPayload?.price || [],
    );
    specGroups.value = normalized.groups;
    skuRows.value = normalized.rows;
    seed.value = normalized.nextSeed;
  }
  mainImageFiles.value = detail.image ? [createUploadFile(detail.image)] : [];
  carouselFiles.value = (detail.images || []).map((item) => createUploadFile(item));
  auditInfo.value = {
    audit_remark: detail.audit_remark,
    audit_status: detail.audit_status,
    audit_status_text: detail.audit_status_text,
    status: detail.status,
    status_text: detail.status_text,
  };
}

async function initPage() {
  loading.value = true;
  try {
    resetFormState();
    metaRef.value = await getGoodsOptionsApi();
    if (isEdit.value) {
      const response = await getGoodsDetailApi(goodsId.value);
      normalizeDetail(response.detail, response.sku);
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('商品表单初始化失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function switchStep(index: number) {
  if (index >= 0 && index < stepItems.length) {
    currentStep.value = index;
  }
}

async function validateBasicStep() {
  const valid = await formRef.value?.validateField(['type', 'title', 'subtitle', 'category_ids', 'dispatch_id']).then(() => true).catch(() => false);
  if (!valid) {
    ElMessage.warning('请先完善基础信息中的必填项');
    return false;
  }
  if (!getUploadedUrl(mainImageFiles.value[0])) {
    ElMessage.warning('请上传商品主图');
    return false;
  }
  if (getUploadedUrls(carouselFiles.value).length === 0) {
    ElMessage.warning('请至少上传一张轮播图');
    return false;
  }
  return true;
}

async function validatePriceStep() {
  const valid = await formRef.value?.validateField(['price', 'original_price']).then(() => true).catch(() => false);
  if (!valid) {
    ElMessage.warning('请先完善价格信息');
    return false;
  }
  if (form.is_sku === 0 && (form.stock === undefined || form.stock === null)) {
    ElMessage.warning('请填写单规格商品库存');
    return false;
  }
  if (form.is_sku === 1) {
    try {
      validateGoodsSpecGroups(specGroups.value);
      validateGoodsSkuRows(skuRows.value);
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : 'SKU 校验失败');
      return false;
    }
  }
  return true;
}

async function validateStepByKey(stepKey: GoodsEditStepKey) {
  switch (stepKey) {
    case 'basic':
      return await validateBasicStep();
    case 'price':
      return await validatePriceStep();
    default:
      return true;
  }
}

async function canReachStep(targetIndex: number) {
  if (targetIndex <= currentStep.value) {
    return true;
  }
  for (let index = 0; index < targetIndex; index++) {
    const stepItem = stepItems[index];
    if (!stepItem) continue;
    const valid = await validateStepByKey(stepItem.key);
    if (!valid) {
      switchStep(index);
      return false;
    }
  }
  return true;
}

async function handleStepChange(index: number) {
  if (index === currentStep.value) return;
  const canMove = await canReachStep(index);
  if (canMove) switchStep(index);
}

async function goNextStep() {
  const nextIndex = currentStep.value + 1;
  const canMove = await canReachStep(nextIndex);
  if (canMove) switchStep(nextIndex);
}

function goPrevStep() {
  switchStep(currentStep.value - 1);
}

function normalizeParamsPayload() {
  return form.params
    .map((item) => ({ content: item.content.trim(), title: item.title.trim() }))
    .filter((item) => item.title || item.content);
}

function buildSkuSavePayload(goodsId: number) {
  return {
    goods_id: goodsId,
    listData: serializeGoodsSkuGroups(specGroups.value),
    priceData: serializeGoodsSkuRows(skuRows.value),
  };
}

async function handleSubmit() {
  const canSubmit = await canReachStep(stepItems.length);
  if (!canSubmit) return;

  saving.value = true;
  try {
    const payload = {
      category_ids: [...form.category_ids],
      content: form.content,
      dispatch_id: form.dispatch_id || 0,
      dispatch_type: form.dispatch_type,
      image: getUploadedUrl(mainImageFiles.value[0]),
      images: getUploadedUrls(carouselFiles.value),
      is_sku: form.is_sku,
      original_price: form.original_price,
      params: normalizeParamsPayload(),
      price: form.price,
      sn: form.is_sku === 0 ? form.sn : '',
      stock: form.is_sku === 0 ? Number(form.stock || 0) : 0,
      subtitle: form.subtitle,
      title: form.title,
      type: form.type,
      weight: form.is_sku === 0 ? form.weight : '',
    };

    if (isEdit.value) {
      const response = await updateGoodsApi({ id: goodsId.value, ...payload });
      if (form.is_sku === 1) {
        try {
          await saveGoodsSkuApi(buildSkuSavePayload(response.detail.id));
          ElMessage.success('商品与 SKU 已保存，并重新提交平台审核');
          router.push(`/goods/detail/${response.detail.id}`);
          return;
        } catch (error) {
          console.error(error);
          ElMessage.error('商品主表已保存，但 SKU 保存失败，请立即检查 SKU 页面');
          router.push(`/goods/sku/${response.detail.id}`);
          return;
        }
      }

      ElMessage.success('商品内容已保存，并重新提交平台审核');
      router.push(`/goods/detail/${response.detail.id}`);
    } else {
      const response = await createGoodsApi(payload);
      if (response.detail.is_sku === 1) {
        try {
          await saveGoodsSkuApi(buildSkuSavePayload(response.detail.id));
          ElMessage.success('商品与 SKU 已创建，等待平台审核后上架');
          router.push(`/goods/detail/${response.detail.id}`);
          return;
        } catch (error) {
          console.error(error);
          ElMessage.error('商品主表已创建，但 SKU 保存失败，请立即检查 SKU 页面');
          router.push(`/goods/sku/${response.detail.id}`);
          return;
        }
      } else {
        ElMessage.success('商品已创建，等待平台审核后上架');
        router.push(`/goods/detail/${response.detail.id}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

watch(
  () => form.dispatch_type,
  () => {
    if (
      form.dispatch_id &&
      !filteredDispatchOptions.value.some((item) => item.id === form.dispatch_id)
    ) {
      form.dispatch_id = undefined;
    }
  },
);

watch(
  () => form.is_sku,
  (nextValue) => {
    if (nextValue === 1 && specGroups.value.length === 0) {
      addSpecGroup();
    }
  },
);

watch(
  () =>
    specGroups.value.map((group) => ({
      id: group.id,
      name: group.name,
      values: group.values.map((value) => ({
        id: value.id,
        name: value.name,
        tempId: value.tempId,
      })),
    })),
  () => {
    if (!isMultipleSku.value) {
      return;
    }
    syncRowsFromGroups();
  },
  { deep: true },
);

onMounted(() => {
  initPage();
});
</script>

<template>
  <Page
    auto-content-height
    :description="isEdit ? '按经营流程维护商品内容，保存后会重新提交平台审核。' : '新建商品提交后会进入待审核状态，平台审核通过后才会上架。'"
    :title="isEdit ? '编辑商品' : '新增商品'"
  >
    <template #extra>
      <div class="flex gap-2">
        <ElButton @click="router.push('/goods/list')">返回列表</ElButton>
        <ElButton v-if="isEdit" @click="router.push(`/goods/sku/${goodsId}`)">
          SKU 管理
        </ElButton>
        <ElButton :loading="saving" type="primary" @click="handleSubmit">
          {{ isEdit ? '保存商品' : '创建商品' }}
        </ElButton>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-muted-foreground">
          当前步骤：{{ currentStepItem?.label }}
        </div>

        <div class="flex flex-wrap gap-2">
          <ElButton :disabled="currentStep === 0" @click="goPrevStep">上一步</ElButton>
          <ElButton
            v-if="currentStep < stepItems.length - 1"
            plain
            type="primary"
            @click="goNextStep"
          >
            下一步
          </ElButton>
          <ElButton :loading="saving" type="primary" @click="handleSubmit">
            {{ isEdit ? '保存商品' : '创建商品' }}
          </ElButton>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="grid gap-4">
      <AnalysisChartCard title="编辑步骤">
        <div class="mx-auto w-full max-w-4xl px-4">
          <ElSteps :active="currentStep" align-center class="goods-edit-steps">
            <ElStep
              v-for="(item, index) in stepItems"
              :key="item.key"
              :title="item.label"
              @click="handleStepChange(index)"
            />
          </ElSteps>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard v-show="currentStepKey === 'basic'" title="基础信息">
        <div
          class="mb-4 rounded-xl border px-4 py-3 text-sm text-muted-foreground"
          :class="
            isEdit
              ? auditNotice?.className || 'border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)]'
              : 'border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)]'
          "
        >
          {{
            isEdit
              ? auditNotice?.text || '当前页保存后会重新提交平台审核，审核通过后才会重新上架。'
              : '新建商品提交后会进入待审核状态，平台审核通过后才会上架。'
          }}
        </div>

        <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="商品类型" prop="type">
              <ElSelect v-model="form.type" placeholder="请选择商品类型">
                <ElOption
                  v-for="item in metaRef?.type_list || []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="商品标题" prop="title">
              <ElInput v-model="form.title" placeholder="请输入商品标题" />
            </ElFormItem>

            <ElFormItem class="md:col-span-2" label="商品副标题" prop="subtitle">
              <ElInput v-model="form.subtitle" placeholder="请输入商品副标题" />
            </ElFormItem>

            <ElFormItem class="md:col-span-2" label="商品分类" prop="category_ids">
                <ElTreeSelect
                  v-model="form.category_ids"
                  :data="categoryOptions"
                  :props="{ children: 'children', label: 'label' }"
                  :render-after-expand="false"
                  check-strictly
                  check-on-click-node
                  multiple
                  node-key="value"
                  show-checkbox
                />
              </ElFormItem>

            <ElFormItem label="发货方式">
              <ElRadioGroup v-model="form.dispatch_type">
                <ElRadio
                  v-for="item in dispatchTypeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label="发货模板" prop="dispatch_id">
              <ElSelect v-model="form.dispatch_id" clearable placeholder="请选择发货模板">
                <ElOption
                  v-for="item in filteredDispatchOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="商品主图">
              <ElUpload
                v-model:file-list="mainImageFiles"
                :before-upload="beforeImageUpload"
                :http-request="handleMainImageUpload"
                :limit="1"
                accept=".png,.jpg,.jpeg,.webp"
                list-type="picture-card"
                @exceed="onMainImageExceed"
                @preview="(file) => openImagePreview(file, mainImageFiles)"
                @remove="removeMainImage"
              >
                上传主图
              </ElUpload>
            </ElFormItem>

            <ElFormItem label="轮播图">
              <ElUpload
                v-model:file-list="carouselFiles"
                :before-upload="beforeImageUpload"
                :http-request="handleCarouselUpload"
                accept=".png,.jpg,.jpeg,.webp"
                list-type="picture-card"
                @preview="(file) => openImagePreview(file, carouselFiles)"
              >
                上传轮播图
              </ElUpload>
            </ElFormItem>
          </div>
        </ElForm>
      </AnalysisChartCard>

      <AnalysisChartCard v-show="currentStepKey === 'price'" title="规格与价格">
        <div class="grid gap-4">
          <div class="rounded-xl border p-4">
            <div class="mb-3 text-sm font-medium">规格模式</div>
            <ElRadioGroup v-model="form.is_sku" :disabled="isEdit">
              <ElRadio :value="0">单规格</ElRadio>
              <ElRadio :value="1">多规格</ElRadio>
            </ElRadioGroup>
            <div v-if="isEdit" class="mt-2 text-xs text-muted-foreground">
              已创建商品的规格模式暂不支持直接切换，请通过新建商品选择正确的规格模式。
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="销售价" prop="price">
              <ElInput v-model="form.price" placeholder="请输入销售价" />
            </ElFormItem>
            <ElFormItem label="原价" prop="original_price">
              <ElInput v-model="form.original_price" placeholder="请输入原价" />
            </ElFormItem>
          </div>

          <template v-if="form.is_sku === 0">
            <div class="grid gap-4 md:grid-cols-3">
              <ElFormItem label="库存">
                <ElInputNumber v-model="form.stock" :controls="false" :min="0" class="w-full" placeholder="请输入库存" />
              </ElFormItem>
              <ElFormItem label="货号">
                <ElInput v-model="form.sn" placeholder="请输入货号" />
              </ElFormItem>
              <ElFormItem label="重量">
                <ElInput v-model="form.weight" placeholder="请输入重量" />
              </ElFormItem>
            </div>
          </template>

          <template v-else>


            <div class="rounded-xl border p-4">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3">
                <div>
                  <div class="text-sm font-medium">先维护规格组和规格值，再自动生成下方规格价格表。</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    当前规格组：{{ specGroups.length }} 组
                    <span class="mx-2">/</span>
                    当前规格组合：{{ skuRows.length }} 条
                  </div>
                </div>

                <ElButton type="primary" plain @click="addSpecGroup">
                  新增规格组
                </ElButton>
              </div>

              <div v-if="specGroups.length > 0" class="grid gap-4">
                <div
                  v-for="(group, groupIndex) in specGroups"
                  :key="group.id || groupIndex"
                  class="rounded-2xl bg-muted/20 p-4"
                >
                  <div class="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div class="space-y-2">
                      <div class="text-xs text-muted-foreground">规格组名称</div>
                      <ElInput
                        v-model="group.name"
                        class="max-w-[260px]"
                        placeholder="例如：颜色 / 尺寸"
                      />
                    </div>

                    <div class="flex flex-wrap gap-2 xl:justify-end">
                      <ElButton plain type="primary" @click="addSpecValue(groupIndex)">
                        新增规格值
                      </ElButton>
                      <ElButton type="danger" @click="removeSpecGroup(groupIndex)">
                        删除规格组
                      </ElButton>
                    </div>
                  </div>

                  <div
                    v-if="group.values.length > 0"
                    class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                  >
                    <div
                      v-for="(value, valueIndex) in group.values"
                      :key="value.tempId"
                      class="flex items-center gap-2 rounded-xl bg-background p-3 shadow-sm"
                    >
                      <ElInput v-model="value.name" placeholder="请输入规格值" />
                      <ElButton
                        type="danger"
                        @click="removeSpecValue(groupIndex, valueIndex)"
                      >
                        删除
                      </ElButton>
                    </div>
                  </div>

                  <ElEmpty
                    v-else
                    description="当前规格组还没有规格值"
                    :image-size="80"
                  />
                </div>
              </div>

              <ElEmpty
                v-else
                description="当前还没有规格组，点击右上角“新增规格组”开始维护"
                :image-size="100"
              />
            </div>

            <div class="rounded-xl border p-4">
              <div class="mb-4">
                <div class="text-sm font-medium">规格价格表</div>
                <div class="text-xs text-muted-foreground">
                  每个规格组合都需要填写至少销售价和库存。
                </div>
              </div>

              <div class="mb-4 rounded-xl border bg-muted/20 p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-medium">批量填充</div>
                    <div class="text-xs text-muted-foreground">
                      只会覆盖已填写的字段，未填写的字段保持原值。
                    </div>
                  </div>

                  <div class="text-xs text-muted-foreground">
                    当前规格：{{ skuRows.length }} 条
                  </div>
                </div>

                <div class="goods-sku-batch-fill grid gap-3 lg:grid-cols-4">
                  <ElInput
                    v-model="skuBatchFillForm.price"
                    placeholder="批量填充销售价"
                  />
                  <ElInput
                    v-model="skuBatchFillForm.original_price"
                    placeholder="批量填充原价"
                  />
                  <ElInput
                    v-model="skuBatchFillForm.cost_price"
                    placeholder="批量填充成本价"
                  />
                  <ElInputNumber
                    v-model="skuBatchFillForm.stock"
                    :controls="false"
                    :min="0"
                    class="w-full"
                    placeholder="批量填充库存"
                  />
                </div>

                <div class="mt-3 flex justify-end gap-2">
                  <ElButton type="primary" @click="handleApplyBatchFillToSkuRows">
                    应用到全部规格
                  </ElButton>
                  <ElButton @click="resetSkuBatchFillForm">
                    清空
                  </ElButton>
                </div>
              </div>

              <div v-if="skuRows.length > 0" class="overflow-x-auto">
                <table class="w-full min-w-[980px] border-collapse text-sm">
                  <thead>
                    <tr class="bg-muted/20 text-center">
                      <th class="border px-3 py-2 font-medium">规格组合</th>
                      <th class="border px-3 py-2 font-medium">图片</th>
                      <th class="border px-3 py-2 font-medium">售价</th>
                      <th class="border px-3 py-2 font-medium">原价</th>
                      <th class="border px-3 py-2 font-medium">成本价</th>
                      <th class="border px-3 py-2 font-medium">库存</th>
                      <th class="border px-3 py-2 font-medium">重量</th>
                      <th class="border px-3 py-2 font-medium">货号</th>
                      <th class="border px-3 py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in skuRows" :key="getCombinationKey(row)">
                      <td class="border px-3 py-2">
                        <div class="flex flex-wrap gap-2 justify-center">
                          <ElTag
                            v-for="item in row.goods_sku_text"
                            :key="item"
                            effect="plain"
                            round
                          >
                            {{ item }}
                          </ElTag>
                        </div>
                      </td>
                      <td class="border px-2 py-2 text-center">
                        <GoodsSkuImageUpload v-model="row.image" />
                      </td>
                      <td class="border px-3 py-2 text-center"><ElInput v-model="row.price" placeholder="售价" /></td>
                      <td class="border px-3 py-2 text-center"><ElInput v-model="row.original_price" placeholder="原价" /></td>
                      <td class="border px-3 py-2 text-center"><ElInput v-model="row.cost_price" placeholder="成本价" /></td>
                      <td class="border px-3 py-2 text-center">
                        <ElInputNumber
                          v-model="row.stock"
                          :controls="false"
                          :min="0"
                          class="w-full"
                          placeholder="库存"
                        />
                      </td>
                      <td class="border px-3 py-2 text-center"><ElInput v-model="row.weight" placeholder="重量" /></td>
                      <td class="border px-3 py-2 text-center"><ElInput v-model="row.sn" placeholder="货号" /></td>
                      <td class="border px-3 py-2 text-center">
                        <ElRadioGroup v-model="row.status">
                          <ElRadio value="up">上架</ElRadio>
                          <ElRadio value="down">下架</ElRadio>
                        </ElRadioGroup>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ElEmpty
                v-else
                description="当前还没有可用的规格组合，请先完善上方规格结构。"
                :image-size="100"
              />
            </div>
          </template>
        </div>
      </AnalysisChartCard>

      <AnalysisChartCard v-show="currentStepKey === 'detail'" title="商品详情">
        <div class="grid gap-4">
          <div class="rounded-xl border p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">参数详情</div>
                <div class="text-xs text-muted-foreground">
                  可维护商品的参数名称与参数内容。
                </div>
              </div>
              <ElButton type="primary" plain @click="appendParamItem">新增参数</ElButton>
            </div>

            <div v-if="form.params.length > 0" class="grid gap-3">
              <div
                v-for="(item, index) in form.params"
                :key="index"
                class="grid gap-3 rounded-xl border p-3 md:grid-cols-[180px_minmax(0,1fr)_90px]"
              >
                <ElInput v-model="item.title" placeholder="参数名称" />
                <ElInput v-model="item.content" placeholder="参数内容" />
                <ElButton type="danger" @click="removeParamItem(index)">删除</ElButton>
              </div>
            </div>
            <ElEmpty v-else description="当前还没有参数详情" :image-size="80" />
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium">图文详情</div>
            <VbenTiptap v-model="form.content" :min-height="320" placeholder="请输入商品图文详情" />
          </div>
        </div>
      </AnalysisChartCard>
    </div>

    <ElImageViewer
      v-if="imagePreviewVisible"
      :initial-index="imagePreviewIndex"
      :url-list="imagePreviewUrls"
      @close="closeImagePreview"
    />
  </Page>
</template>

<style scoped>
.goods-edit-steps {
  @apply mx-auto max-w-3xl mb-4;
}

:deep(.goods-edit-steps .el-step) {
  cursor: pointer;
}

:deep(.goods-edit-steps .el-step__title) {
  @apply text-sm mt-2;
}

:deep(.goods-sku-batch-fill .el-input),
:deep(.goods-sku-batch-fill .el-input-number) {
  width: 100%;
}
</style>
