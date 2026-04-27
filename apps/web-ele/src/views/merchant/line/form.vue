<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  MerchantLineDetail,
  MerchantLineMetaResult,
  MerchantUploadResult,
} from '#/api';

import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AnalysisChartCard, Page, VCropper, useVbenModal } from '@vben/common-ui';
import { useSortable } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { VbenTiptap } from '@vben/plugins/tiptap';

import type {
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';

import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElImageViewer,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElStep,
  ElSteps,
  ElTooltip,
  ElTag,
  ElUpload,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createLineApi,
  getLineDetailApi,
  getLineOptionsApi,
  updateLineApi,
  uploadMerchantFileAttachment,
  uploadMerchantImage,
} from '#/api';

import TagSelectorModal from './modules/tag-selector.vue';

defineOptions({ name: 'MerchantLineFormPage' });

interface LineDayInfoItem {
  city: string;
  content: string;
  meals: string;
  name: string;
  stay: string;
  travel: string;
}

interface LineExtraContentState {
  content: string;
  content1: string;
  content2: string;
  content3: string;
  content4: string;
  content5: string;
}

type LineExtraContentKey =
  | 'content1'
  | 'content2'
  | 'content3'
  | 'content4'
  | 'content5';

interface LineTreeOption {
  children?: LineTreeOption[];
  label: string;
  value: number;
}

interface LineTagOption {
  id: number;
  name: string;
}

interface LineTagGroupOption {
  id?: number;
  tags?: LineTagOption[];
  title?: string;
}

type LineEditStepKey =
  | 'basic'
  | 'extra'
  | 'media'
  | 'schedule'
  | 'detail';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const metaRef = ref<MerchantLineMetaResult | null>(null);
const currentStep = ref(0);
const activeDayIndex = ref(0);
const auditInfo = ref<null | Pick<
  MerchantLineDetail,
  | 'audit_remark'
  | 'audit_status'
  | 'audit_status_text'
  | 'status'
  | 'status_text'
>>(null);

const lineId = computed(() => Number(route.params.id || 0));
const isEdit = computed(() => !!lineId.value);

const carouselFiles = ref<UploadUserFile[]>([]);
const posterFiles = ref<UploadUserFile[]>([]);
const videoFiles = ref<UploadUserFile[]>([]);
const attachmentFiles = ref<UploadUserFile[]>([]);
const dayInfoList = ref<LineDayInfoItem[]>([]);
const selectedTagIds = ref<number[]>([]);
const selectedInsuranceIds = ref<number[]>([]);
const carouselUploadWrapperRef = ref<HTMLElement | null>(null);
let carouselSortable: null | { destroy?: () => void } = null;
const imagePreviewVisible = ref(false);
const imagePreviewIndex = ref(0);
const imagePreviewUrls = ref<string[]>([]);
const imageCropVisible = ref(false);
const imageCropLoading = ref(false);
const imageCropSource = ref('');
const imageCropAspectRatio = ref('');
const imageCropTitle = ref('裁剪图片');
const imageCropperRef = ref<InstanceType<typeof VCropper> | null>(null);
const pendingCropFile = ref<File | null>(null);
const pendingCropTarget = ref<'carousel' | 'poster'>('carousel');

const [TagSelector, tagSelectorApi] = useVbenModal({
  connectedComponent: TagSelectorModal,
  destroyOnClose: true,
});

const detailContent = reactive<LineExtraContentState>({
  content: '',
  content1: '',
  content2: '',
  content3: '',
  content4: '',
  content5: '',
});

function createEmptyDayInfoItem(): LineDayInfoItem {
  return {
    city: '',
    content: '',
    meals: '',
    name: '',
    stay: '',
    travel: '',
  };
}

function createUploadFile(url: string, name?: string): UploadUserFile {
  const normalizedUrl = url || '';
  return {
    name: name || normalizedUrl.split('/').pop() || '文件',
    status: 'success',
    uid: Date.now() + Math.floor(Math.random() * 1000),
    url: normalizedUrl,
  };
}

function createUploadedUserFile(
  data: MerchantUploadResult,
  file: File,
): UploadUserFile {
  return {
    name: file.name,
    response: data,
    status: 'success',
    uid: Date.now() + Math.floor(Math.random() * 1000),
    url: data.fullurl || data.url,
  };
}

function closeImageCropper() {
  if (imageCropSource.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageCropSource.value);
  }
  imageCropVisible.value = false;
  imageCropLoading.value = false;
  imageCropSource.value = '';
  imageCropAspectRatio.value = '';
  imageCropTitle.value = '裁剪图片';
  pendingCropFile.value = null;
  pendingCropTarget.value = 'carousel';
}

function normalizeTreeOptions(items: Array<Record<string, any>> = []): LineTreeOption[] {
  return items.map((item) => ({
    children: item.children ? normalizeTreeOptions(item.children) : undefined,
    label: item.name,
    value: Number(item.id),
  }));
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

function syncDayInfoCount(rawValue: number | string | undefined) {
  const count = Math.max(0, Number(rawValue) || 0);
  const currentList = [...dayInfoList.value];

  if (count === 0) {
    dayInfoList.value = [];
    return;
  }

  if (currentList.length < count) {
    const nextList = [...currentList];
    while (nextList.length < count) {
      nextList.push(createEmptyDayInfoItem());
    }
    dayInfoList.value = nextList;
    return;
  }

  if (currentList.length > count) {
    dayInfoList.value = currentList.slice(0, count);
  }
}

function switchStep(index: number) {
  if (index < 0 || index > stepItems.length - 1) {
    return;
  }
  currentStep.value = index;
}

function goPrevStep() {
  switchStep(currentStep.value - 1);
}

function openDay(index: number) {
  if (index < 0 || index > dayInfoList.value.length - 1) {
    return;
  }
  activeDayIndex.value = index;
}

function getDaySummary(item: LineDayInfoItem) {
  const parts = [item.city, item.travel, item.stay]
    .map((value) => value.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '未填写摘要';
}

async function validateBasicStep() {
  const { valid } = await formApi.validate();
  if (!valid) {
    ElMessage.warning('请先完善基础信息中的必填项');
    return false;
  }
  return true;
}

function validateMediaStep() {
  if (getUploadedUrls(carouselFiles.value).length === 0) {
    ElMessage.warning('请至少上传一张轮播图后再继续');
    return false;
  }
  return true;
}

async function validateStepByKey(stepKey: LineEditStepKey) {
  switch (stepKey) {
    case 'basic': {
      return await validateBasicStep();
    }
    case 'media': {
      return validateMediaStep();
    }
    default: {
      return true;
    }
  }
}

async function canReachStep(targetIndex: number) {
  if (targetIndex <= currentStep.value) {
    return true;
  }

  for (let index = 0; index < targetIndex; index++) {
    const stepItem = stepItems[index];
    if (!stepItem) {
      continue;
    }

    const valid = await validateStepByKey(stepItem.key);
    if (!valid) {
      switchStep(index);
      return false;
    }
  }

  return true;
}

async function handleStepChange(index: number) {
  if (index === currentStep.value) {
    return;
  }

  const canMove = await canReachStep(index);
  if (!canMove) {
    return;
  }

  switchStep(index);
}

async function goNextStep() {
  const nextIndex = currentStep.value + 1;
  const canMove = await canReachStep(nextIndex);
  if (!canMove) {
    return;
  }

  switchStep(nextIndex);
}

const tagOptions = computed(() => {
  return (metaRef.value?.tag_groups || []).flatMap((group) =>
    (group.tags || []).map((tag: Record<string, any>) => ({
      label: `${group.title} / ${tag.name}`,
      value: tag.id,
    })),
  );
});

const tagGroupOptions = computed<LineTagGroupOption[]>(() => {
  return (metaRef.value?.tag_groups || []).map((group, index) => ({
    id: Number(group.id || index),
    tags: (group.tags || []).map((tag: Record<string, any>) => ({
      id: Number(tag.id),
      name: String(tag.name || ''),
    })),
    title: String(group.title || `标签组 ${index + 1}`),
  }));
});

const selectedTagMap = computed(() => {
  return new Map(
    tagOptions.value.map((item) => [Number(item.value), item.label]),
  );
});

const selectedTagLabels = computed(() => {
  return selectedTagIds.value
    .map((id) => selectedTagMap.value.get(id))
    .filter(Boolean) as string[];
});

const stepItems = [
  { key: 'basic', label: '基础信息' },
  { key: 'extra', label: '附加项目' },
  { key: 'media', label: '媒体资源' },
  { key: 'schedule', label: '行程安排' },
  { key: 'detail', label: '线路详情' },
] satisfies Array<{ key: LineEditStepKey; label: string }>;

const currentStepItem = computed(() => stepItems[currentStep.value]);
const currentStepKey = computed<LineEditStepKey>(() => {
  return currentStepItem.value?.key || 'basic';
});

const activeDayItem = computed(() => {
  return dayInfoList.value[activeDayIndex.value] || null;
});

const auditNotice = computed(() => {
  if (!isEdit.value || !auditInfo.value) {
    return null;
  }

  if (auditInfo.value.audit_status === '2') {
    return {
      className:
        'border-[var(--el-color-danger-light-5)] bg-[var(--el-color-danger-light-9)]',
      text: auditInfo.value.audit_remark
        ? `当前线路审核已驳回：${auditInfo.value.audit_remark}。请修改后重新提交审核。`
        : '当前线路审核已驳回，请修改内容后重新提交审核。',
    };
  }

  if (auditInfo.value.audit_status === '0') {
    return {
      className:
        'border-[var(--el-color-warning-light-5)] bg-[var(--el-color-warning-light-9)]',
      text: '当前线路处于待审核状态，平台审核通过后才会上架；本页保存后会继续保持待审核。',
    };
  }

  return {
    className:
      'border-[var(--el-color-success-light-5)] bg-[var(--el-color-success-light-9)]',
    text: '当前线路已审核通过。若你在本页保存线路内容，系统会重新提交平台审核。',
  };
});

const extraContentFields = computed<
  Array<{ key: LineExtraContentKey; label: string }>
>(() => {
  const lineConfig = metaRef.value?.line_config || {};
  const keys: LineExtraContentKey[] = [
    'content1',
    'content2',
    'content3',
    'content4',
    'content5',
  ];

  return keys
    .map((key) => ({
      key,
      label: String(lineConfig[key] || '').trim(),
    }))
    .filter((item) => item.label);
});

const insuranceOptions = computed(() => {
  return (metaRef.value?.project_list || []).map((item) => ({
    label: item.name,
    value: Number(item.id),
  }));
});

const startCityOptions = computed(() => {
  return normalizeTreeOptions(metaRef.value?.start_city_options || []);
});

const endCityOptions = computed(() => {
  return normalizeTreeOptions(metaRef.value?.end_city_options || []);
});

const siteOptions = computed(() => {
  return normalizeTreeOptions(metaRef.value?.site_options || []);
});

const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '线路标题',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'type',
    label: '线路类型',
    componentProps: {
      allowClear: true,
      options: metaRef.value?.type_list || [],
    },
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'lineday',
    label: '线路天数',
    componentProps: {
      min: 1,
      onChange: (value: number) => syncDayInfoCount(value),
    },
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'linenight',
    label: '多少晚',
    componentProps: {
      min: 0,
    },
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'linebefore',
    label: '提前报名天数',
    componentProps: {
      min: 0,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'min_num',
    label: '最低成团人数',
    componentProps: {
      min: 0,
    },
  },
  {
    component: 'Input',
    fieldName: 'mobile',
    label: '联系电话',
  },
  {
    component: 'TreeSelect',
    fieldName: 'startcity',
    label: '出发地',
    defaultValue: [],
    componentProps: {
      allowClear: true,
      multiple: true,
      checkStrictly: true,
      checkOnClickNode: true,
      data: startCityOptions.value,
      props: { label: 'label', value: 'value', children: 'children' },
      renderAfterExpand: false,
      showCheckbox: true,
    },
    rules: 'required',
  },
  {
    component: 'TreeSelect',
    fieldName: 'endcity',
    label: '目的地',
    defaultValue: [],
    componentProps: {
      allowClear: true,
      multiple: true,
      checkStrictly: true,
      checkOnClickNode: true,
      data: endCityOptions.value,
      props: { label: 'label', value: 'value', children: 'children' },
      renderAfterExpand: false,
      showCheckbox: true,
    },
    rules: 'required',
  },
  {
    component: 'TreeSelect',
    fieldName: 'site_ids',
    label: '上车点',
    componentProps: {
      allowClear: true,
      multiple: true,
      checkStrictly: true,
      checkOnClickNode: true,
      data: siteOptions.value,
      props: { label: 'label', value: 'value', children: 'children' },
      renderAfterExpand: false,
      showCheckbox: true,
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'isMultiSignatory',
    defaultValue: '0',
    label: () =>
      h('span', { class: 'inline-flex items-center gap-1' }, [
        h('span', '多人签约'),
        h(
          ElTooltip,
          {
            content: '开启多人签约后，订单中的所有旅客都会收到待签合同并参与签署。',
            placement: 'top',
          },
          {
            default: () =>
              h(IconifyIcon, {
                class: 'cursor-help text-[var(--el-color-primary)]',
                icon: 'lucide:circle-help',
              }),
          },
        ),
      ]),
    componentProps: {
      options: [
        { label: '否', value: '0' },
        { label: '是', value: '1' },
      ],
      isButton: true,
    },
  },
  {
    component: 'Input',
    fieldName: 'desc',
    label: '线路简介',
    componentProps: {
      rows: 3,
      type: 'textarea',
    },
    formItemClass: 'col-span-2',
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4 md:grid-cols-2',
});

function normalizeLineDetail(detail: Record<string, any>) {
  return {
    desc: detail.desc || '',
    endcity: (detail.endcity || []).map((item: Record<string, any>) => item.id),
    isMultiSignatory: detail.isMultiSignatory || '0',
    lineday: detail.lineday || 1,
    linebefore: detail.linebefore || 0,
    linenight: detail.linenight || 0,
    min_num: detail.min_num || 0,
    mobile: detail.mobile || '',
    site_ids: (detail.site_ids || []).map((item: Record<string, any>) => item.id),
    startcity: (detail.startcity || []).map((item: Record<string, any>) => item.id),
    title: detail.title || '',
    type: detail.type || '',
  };
}

function setMediaFiles(detail: Record<string, any>) {
  carouselFiles.value = (detail.images || []).map((item: string) =>
    createUploadFile(item),
  );
  posterFiles.value = detail.poster ? [createUploadFile(detail.poster)] : [];
  videoFiles.value = detail.video ? [createUploadFile(detail.video)] : [];
  attachmentFiles.value = detail.file ? [createUploadFile(detail.file)] : [];
}

function setDetailContent(detail: Record<string, any>) {
  detailContent.content = detail.content || '';
  detailContent.content1 = detail.content1 || '';
  detailContent.content2 = detail.content2 || '';
  detailContent.content3 = detail.content3 || '';
  detailContent.content4 = detail.content4 || '';
  detailContent.content5 = detail.content5 || '';
}

function setDayInfo(detail: Record<string, any>) {
  dayInfoList.value = (detail.dayinfo || []).map((item: Record<string, any>) => ({
    city: item.city || '',
    content: item.content || '',
    meals: item.meals || '',
    name: item.name || '',
    stay: item.stay || '',
    travel: item.travel || '',
  }));
  syncDayInfoCount(detail.lineday || 0);
}

function setSelectedTags(detail: Record<string, any>) {
  selectedTagIds.value = (detail.tagids || []).map((item: Record<string, any>) =>
    Number(item.id),
  );
}

function setSelectedInsurance(detail: Record<string, any>) {
  selectedInsuranceIds.value = (detail.insuranceids || []).map((item: string | number) =>
    Number(item),
  );
}

async function loadMeta() {
  metaRef.value = await getLineOptionsApi();
  formApi.updateSchema([
    {
      fieldName: 'type',
      componentProps: {
        allowClear: true,
        options: metaRef.value.type_list || [],
      },
    },
    {
      fieldName: 'startcity',
      componentProps: {
        allowClear: true,
        checkStrictly: true,
        checkOnClickNode: true,
        data: startCityOptions.value,
        multiple: true,
        props: { label: 'label', value: 'value', children: 'children' },
        renderAfterExpand: false,
        showCheckbox: true,
      },
    },
    {
      fieldName: 'endcity',
      componentProps: {
        allowClear: true,
        checkStrictly: true,
        checkOnClickNode: true,
        data: endCityOptions.value,
        multiple: true,
        props: { label: 'label', value: 'value', children: 'children' },
        renderAfterExpand: false,
        showCheckbox: true,
      },
    },
    {
      fieldName: 'site_ids',
      componentProps: {
        allowClear: true,
        checkStrictly: true,
        checkOnClickNode: true,
        data: siteOptions.value,
        multiple: true,
        props: { label: 'label', value: 'value', children: 'children' },
        renderAfterExpand: false,
        showCheckbox: true,
      },
    },
    {
      fieldName: 'isMultiSignatory',
      componentProps: {
        allowClear: true,
        options: metaRef.value.multi_signatory_list || [],
      },
    },
  ]);
}

async function loadDetail() {
  if (!isEdit.value) {
    auditInfo.value = null;
    syncDayInfoCount(1);
    return;
  }

  const response = await getLineDetailApi(lineId.value);
  auditInfo.value = {
    audit_remark: response.detail.audit_remark,
    audit_status: response.detail.audit_status,
    audit_status_text: response.detail.audit_status_text,
    status: response.detail.status,
    status_text: response.detail.status_text,
  };
  await formApi.setValues(normalizeLineDetail(response.detail));
  setMediaFiles(response.detail);
  setDetailContent(response.detail);
  setDayInfo(response.detail);
  setSelectedTags(response.detail);
  setSelectedInsurance(response.detail);
}

async function initPage() {
  loading.value = true;
  try {
    await loadMeta();
    await loadDetail();
  } catch (error) {
    console.error(error);
    ElMessage.error('线路表单初始化失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function removeVideoFile() {
  videoFiles.value = [];
}

function removeAttachmentFile() {
  attachmentFiles.value = [];
}

function openUploadedResource(file?: UploadUserFile) {
  const url = getUploadedUrl(file);
  if (!url) {
    return;
  }
  window.open(url, '_blank');
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

function beforeImageUpload(rawFile: File) {
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
}

function openCropperByFile(
  rawFile: File,
  target: 'carousel' | 'poster',
  options?: {
    aspectRatio?: string;
    title?: string;
  },
) {
  const canContinue = beforeImageUpload(rawFile);
  if (!canContinue) {
    return false;
  }

  pendingCropFile.value = rawFile;
  pendingCropTarget.value = target;
  imageCropSource.value = URL.createObjectURL(rawFile);
  imageCropAspectRatio.value = options?.aspectRatio || '';
  imageCropTitle.value = options?.title || '裁剪图片';
  imageCropVisible.value = true;
  return false;
}

function beforeCarouselUpload(rawFile: File) {
  return openCropperByFile(rawFile, 'carousel', {
    title: '裁剪轮播图',
  });
}

function beforePosterUpload(rawFile: File) {
  return openCropperByFile(rawFile, 'poster', {
    aspectRatio: '3:4',
    title: '裁剪海报',
  });
}

function onPosterExceed() {
  ElMessage.warning('海报仅支持上传 1 张图片');
}

function beforeVideoUpload(rawFile: File) {
  const isValidVideo = ['video/mp4', 'video/webm'].includes(rawFile.type);
  if (!isValidVideo) {
    ElMessage.error('仅支持上传 MP4、WEBM 格式视频');
    return false;
  }

  const isLt20M = rawFile.size / 1024 / 1024 < 20;
  if (!isLt20M) {
    ElMessage.error('视频大小不能超过 20MB');
    return false;
  }

  return true;
}

function handleImageUpload(options: UploadRequestOptions) {
  return uploadMerchantImage({
    file: options.file as File,
    onError: (error) => options.onError(error as any),
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => options.onSuccess(data),
  });
}

function handleVideoUpload(options: UploadRequestOptions) {
  const uploadFile = options.file as File;
  return uploadMerchantFileAttachment({
    file: uploadFile,
    onError: (error) => options.onError(error as any),
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => {
      videoFiles.value = [createUploadedUserFile(data, uploadFile)];
      options.onSuccess(data);
    },
  });
}

function handleAttachmentUpload(options: UploadRequestOptions) {
  const uploadFile = options.file as File;
  return uploadMerchantFileAttachment({
    file: uploadFile,
    onError: (error) => options.onError(error as any),
    onProgress: (progress) => options.onProgress(progress as any),
    onSuccess: (data) => {
      attachmentFiles.value = [createUploadedUserFile(data, uploadFile)];
      options.onSuccess(data);
    },
  });
}

async function initCarouselSortable(retryCount = 0) {
  await nextTick();

  const wrapper = carouselUploadWrapperRef.value;
  const listElement = wrapper?.querySelector(
    '.el-upload-list',
  ) as HTMLElement | null;

  if (!listElement) {
    if (retryCount < 5) {
      setTimeout(() => {
        initCarouselSortable(retryCount + 1);
      }, 120);
    }
    return;
  }

  carouselSortable?.destroy?.();
  const { initializeSortable } = useSortable(listElement, {
    animation: 200,
    onEnd(event) {
      const { newIndex, oldIndex } = event;
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      ) {
        return;
      }

      const nextFiles = [...carouselFiles.value];
      const [movedItem] = nextFiles.splice(oldIndex, 1);
      if (!movedItem) {
        return;
      }
      nextFiles.splice(newIndex, 0, movedItem);
      carouselFiles.value = nextFiles;
    },
  });

  carouselSortable = await initializeSortable();
}

async function handleImageCropConfirm() {
  if (!imageCropperRef.value || !pendingCropFile.value) {
    return;
  }

  imageCropLoading.value = true;
  try {
    const croppedBlob = await imageCropperRef.value.getCropImage(
      'image/jpeg',
      0.92,
      'blob',
    );

    if (!(croppedBlob instanceof Blob)) {
      ElMessage.error('图片裁剪失败，请重试');
      imageCropLoading.value = false;
      return;
    }

    const uploadFile = new File(
      [croppedBlob],
      pendingCropFile.value.name ||
        (pendingCropTarget.value === 'poster' ? 'poster.jpg' : 'carousel.jpg'),
      {
        type: 'image/jpeg',
      },
    );

    await uploadMerchantImage({
      file: uploadFile,
      onError: (error) => {
        throw error;
      },
      onSuccess: (data) => {
        const uploadedFile: UploadUserFile = {
          name: uploadFile.name,
          response: data,
          status: 'success',
          uid: Date.now(),
          url: data.fullurl || data.url,
        };

        if (pendingCropTarget.value === 'poster') {
          posterFiles.value = [uploadedFile];
        } else {
          carouselFiles.value = [...carouselFiles.value, uploadedFile];
        }
      },
    });

    ElMessage.success(
      pendingCropTarget.value === 'poster'
        ? '海报已裁剪并上传'
        : '轮播图已裁剪并上传',
    );
    closeImageCropper();
  } catch (error) {
    console.error(error);
    ElMessage.error('图片上传失败，请稍后重试');
    imageCropLoading.value = false;
  }
}

function normalizeDayInfoPayload() {
  return dayInfoList.value.map((item) => ({
    city: item.city.trim(),
    content: item.content.trim(),
    meals: item.meals.trim(),
    name: item.name.trim(),
    stay: item.stay.trim(),
    travel: item.travel.trim(),
  }));
}

function openTagSelector() {
  tagSelectorApi
    .setData({
      selectedIds: selectedTagIds.value,
      tagGroups: tagGroupOptions.value,
    })
    .open();
}

function handleTagConfirm(tagIds: number[]) {
  selectedTagIds.value = [...tagIds];
}

async function handleSubmit() {
  const canSubmit = await canReachStep(stepItems.length);
  if (!canSubmit) {
    return;
  }

  saving.value = true;
  try {
    const values = (await formApi.getValues()) as Record<string, any>;
    const payload: Record<string, any> = {
      ...values,
      ...detailContent,
      dayinfo: normalizeDayInfoPayload(),
      file: getUploadedUrl(attachmentFiles.value[0]),
      images: getUploadedUrls(carouselFiles.value),
      insuranceids: [...selectedInsuranceIds.value],
      poster: getUploadedUrl(posterFiles.value[0]),
      tagids: [...selectedTagIds.value],
      video: getUploadedUrl(videoFiles.value[0]),
    };

    if (isEdit.value) {
      await updateLineApi({
        id: lineId.value,
        ...payload,
      });
      ElMessage.success('线路内容已保存，并重新提交平台审核');
      router.push(`/line/detail/${lineId.value}`);
    } else {
      const response = await createLineApi(payload);
      ElMessage.success('线路已创建，等待平台审核后上架');
      router.push(`/line/detail/${response.detail.id}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  initPage();
  initCarouselSortable();
});

watch(
  () => carouselFiles.value.length,
  async () => {
    await initCarouselSortable();
  },
);

watch(
  () => dayInfoList.value.length,
  (length) => {
    if (length === 0) {
      activeDayIndex.value = 0;
      return;
    }

    if (activeDayIndex.value > length - 1) {
      activeDayIndex.value = length - 1;
    }
  },
);

onBeforeUnmount(() => {
  carouselSortable?.destroy?.();
  closeImageCropper();
});
</script>

<template>
  <div>
    <TagSelector @confirm="handleTagConfirm" />

    <Page
      auto-content-height
      :description="isEdit ? '按经营流程维护线路内容，保存后会重新提交平台审核；套餐与价格库存可继续单独维护。' : '新建线路提交后会进入待审核状态，平台审核通过后才会上架。'"
      :title="isEdit ? '编辑线路' : '新增线路'"
    >
      <template #extra>
        <div class="flex gap-2">
          <ElButton @click="router.push('/line/list')">返回列表</ElButton>
          <ElButton :loading="saving" type="primary" @click="handleSubmit">
            {{ isEdit ? '保存线路' : '创建线路' }}
          </ElButton>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-muted-foreground">
            当前步骤：{{ currentStepItem?.label }}
          </div>

          <div class="flex flex-wrap gap-2">
            <ElButton :disabled="currentStep === 0" @click="goPrevStep">
              上一步
            </ElButton>
            <ElButton
              v-if="currentStep < stepItems.length - 1"
              plain
              type="primary"
              @click="goNextStep"
            >
              下一步
            </ElButton>
            <ElButton :loading="saving" type="primary" @click="handleSubmit">
              {{ isEdit ? '保存线路' : '创建线路' }}
            </ElButton>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="grid gap-4">
        <AnalysisChartCard title="编辑步骤">
          <div class="mx-auto w-full max-w-4xl px-4">
            <ElSteps :active="currentStep" align-center class="line-edit-steps">
              <ElStep
                v-for="(item, index) in stepItems"
                :key="item.key"
                :title="item.label"
                @click="handleStepChange(index)"
              />
            </ElSteps>
          </div>
        </AnalysisChartCard>


        <AnalysisChartCard
          v-show="currentStepKey === 'basic'"
          title="基础信息"
        >
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
                : '新建线路提交后会进入待审核状态，平台审核通过后才会上架。'
            }}
          </div>

          <Form />

          <div class="mt-4 rounded-xl border p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm font-medium">线路标签</div>

              <div class="flex gap-2">
                <ElButton @click="openTagSelector">选择标签</ElButton>
                <ElButton
                  v-if="selectedTagIds.length > 0"
                  @click="selectedTagIds = []"
                >
                  清空标签
                </ElButton>
              </div>
            </div>

            <div
              v-if="selectedTagLabels.length > 0"
              class="flex flex-wrap gap-2"
            >
              <ElTag
                v-for="item in selectedTagLabels"
                :key="item"
                effect="plain"
                round
              >
                {{ item }}
              </ElTag>
            </div>

            <ElEmpty
              v-else
              description="当前还没有选择任何标签"
              :image-size="80"
            />
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard
          v-show="currentStepKey === 'extra'"
          title="附加项目"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <div class="text-sm font-medium">保险产品</div>
              <ElSelect
                v-model="selectedInsuranceIds"
                clearable
                filterable
                multiple
                placeholder="请选择保险产品"
              >
                <ElOption
                  v-for="item in insuranceOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </div>
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard
          v-show="currentStepKey === 'media'"
          title="媒体资源"
        >
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium">轮播图</div>
                <div class="text-xs text-muted-foreground">
                  参考示例页的图片卡片上传样式，支持拖拽调整展示顺序。
                </div>
              </div>

              <div ref="carouselUploadWrapperRef" class="line-upload-card">
                <ElUpload
                  v-model:file-list="carouselFiles"
                  :before-upload="beforeCarouselUpload"
                  :http-request="handleImageUpload"
                  accept=".png,.jpg,.jpeg,.webp"
                  list-type="picture-card"
                  @preview="(file) => openImagePreview(file, carouselFiles)"
                >
                  上传图片
                </ElUpload>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium">海报</div>
                <div class="text-xs text-muted-foreground">
                  单图封面卡片上传，建议使用清晰的竖版海报图。
                </div>
              </div>

              <div class="line-upload-card">
                <ElUpload
                  v-model:file-list="posterFiles"
                  :before-upload="beforePosterUpload"
                  :http-request="handleImageUpload"
                  :limit="1"
                  accept=".png,.jpg,.jpeg,.webp"
                  list-type="picture-card"
                  @exceed="onPosterExceed"
                  @preview="(file) => openImagePreview(file, posterFiles)"
                >
                  上传海报
                </ElUpload>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm font-medium">视频</div>
              <ElUpload
                v-model:file-list="videoFiles"
                :before-upload="beforeVideoUpload"
                :http-request="handleVideoUpload"
                :limit="1"
                accept="video/*"
                :show-file-list="false"
              >
                <ElButton>上传视频</ElButton>
              </ElUpload>

              <div
                v-if="videoFiles.length > 0"
                class="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ videoFiles[0]?.name || '已上传视频' }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    已上传视频文件
                  </div>
                </div>
                <div class="flex gap-2">
                  <ElButton
                    size="small"
                    @click="openUploadedResource(videoFiles[0])"
                  >
                    预览
                  </ElButton>
                  <ElButton size="small" type="danger" @click="removeVideoFile">
                    删除
                  </ElButton>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm font-medium">行程文件</div>
              <ElUpload
                v-model:file-list="attachmentFiles"
                :http-request="handleAttachmentUpload"
                :limit="1"
                :show-file-list="false"
              >
                <ElButton>上传文件</ElButton>
              </ElUpload>

              <div
                v-if="attachmentFiles.length > 0"
                class="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ attachmentFiles[0]?.name || '已上传文件' }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    已上传行程文件
                  </div>
                </div>
                <div class="flex gap-2">
                  <ElButton
                    size="small"
                    @click="openUploadedResource(attachmentFiles[0])"
                  >
                    下载
                  </ElButton>
                  <ElButton size="small" type="danger" @click="removeAttachmentFile">
                    删除
                  </ElButton>
                </div>
              </div>
            </div>
          </div>
        </AnalysisChartCard>

        <AnalysisChartCard
          v-show="currentStepKey === 'schedule'"
          title="行程安排"
        >
          <div v-if="dayInfoList.length > 0" class="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div class="grid gap-3">
              <button
                v-for="(item, index) in dayInfoList"
                :key="index"
                class="rounded-xl border p-4 text-left transition"
                :class="
                  activeDayIndex === index
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'hover:border-primary/40'
                "
                type="button"
                @click="openDay(index)"
              >
                <div class="mb-2 text-sm font-medium">第 {{ index + 1 }} 天</div>
                <div class="truncate text-sm">
                  {{ item.name || '未设置标题' }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ getDaySummary(item) }}
                </div>
              </button>
            </div>

            <div
              v-if="activeDayItem"
              class="grid gap-4 rounded-xl border p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-base font-medium">
                  第 {{ activeDayIndex + 1 }} 天
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ElInput v-model="activeDayItem.name" placeholder="行程标题" />
                <ElInput v-model="activeDayItem.city" placeholder="前往城市" />
                <ElInput v-model="activeDayItem.meals" placeholder="用餐情况" />
                <ElInput v-model="activeDayItem.stay" placeholder="住宿情况" />
                <ElInput v-model="activeDayItem.travel" placeholder="交通工具" />
              </div>

              <VbenTiptap
                v-model="activeDayItem.content"
                :min-height="260"
                placeholder="填写当天详细行程内容"
              />
            </div>
          </div>

          <ElEmpty
            v-else
            description="先在基础信息里填写线路天数，系统会自动生成对应的行程安排表单。"
          />
        </AnalysisChartCard>

        <AnalysisChartCard
          v-show="currentStepKey === 'detail'"
          title="线路详情"
        >
          <div class="grid gap-4">
            <div class="space-y-2">
              <div class="text-sm font-medium">主详情内容</div>
              <VbenTiptap
                v-model="detailContent.content"
                placeholder="填写线路详情内容"
              />
            </div>

            <div
              v-if="extraContentFields.length > 0"
              class="grid gap-4 lg:grid-cols-2"
            >
              <div
                v-for="field in extraContentFields"
                :key="field.key"
                class="space-y-2"
              >
                <div class="text-sm font-medium">{{ field.label }}</div>
                <VbenTiptap
                  v-model="detailContent[field.key]"
                  :min-height="220"
                  :placeholder="field.label"
                />
              </div>
            </div>
          </div>
        </AnalysisChartCard>
      </div>
    </Page>

    <ElImageViewer
      v-if="imagePreviewVisible"
      :initial-index="imagePreviewIndex"
      :url-list="imagePreviewUrls"
      @close="closeImagePreview"
    />

  <ElDialog
    v-model="imageCropVisible"
      append-to-body
      destroy-on-close
      :title="imageCropTitle"
      width="760px"
      @closed="closeImageCropper"
    >
      <div class="grid gap-4">
        <div class="text-sm text-muted-foreground">
          上传图片前先裁剪，轮播图支持自由裁剪，海报会按固定比例裁剪。
        </div>

        <div class="flex justify-center">
          <VCropper
            v-if="imageCropSource"
            ref="imageCropperRef"
            :aspect-ratio="imageCropAspectRatio || undefined"
            :height="520"
            :img="imageCropSource"
            :width="680"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="closeImageCropper">取消</ElButton>
          <ElButton
            :loading="imageCropLoading"
            type="primary"
            @click="handleImageCropConfirm"
          >
            裁剪并上传
          </ElButton>
        </div>
    </template>
  </ElDialog>
  </div>
</template>

<style scoped>
.line-edit-steps {
  @apply mx-auto max-w-3xl mb-4;
}

:deep(.line-edit-steps .el-step) {
  cursor: pointer;
}

:deep(.line-edit-steps .el-step__title) {
  @apply text-sm mt-2;
}
</style>
