<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElEmpty,
  ElTag,
} from 'element-plus';

defineOptions({ name: 'MerchantLineTagSelectorModal' });

interface TagOption {
  id: number;
  name: string;
}

interface TagGroupOption {
  id?: number;
  tags?: TagOption[];
  title?: string;
}

const emit = defineEmits<{
  confirm: [tagIds: number[]];
}>();

const tagGroups = ref<TagGroupOption[]>([]);
const selectedTagIds = ref<number[]>([]);

const selectedCount = computed(() => selectedTagIds.value.length);

function resetSelection() {
  selectedTagIds.value = [];
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    emit('confirm', [...selectedTagIds.value]);
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{
      selectedIds?: number[];
      tagGroups?: TagGroupOption[];
    }>();

    tagGroups.value = data.tagGroups || [];
    selectedTagIds.value = [...(data.selectedIds || [])];
  },
  title: '选择标签',
});
</script>

<template>
  <Modal class="w-full max-w-[880px]">
    <div class="grid gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <div class="text-sm font-medium">按标签组选择</div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ElTag effect="plain" round>
            已选 {{ selectedCount }} 个
          </ElTag>
          <ElButton @click="resetSelection">清空已选</ElButton>
        </div>
      </div>

      <div v-if="tagGroups.length > 0" class="grid gap-4">
        <div
          v-for="(group, index) in tagGroups"
          :key="group.id || `${group.title || 'group'}-${index}`"
          class="rounded-xl border p-4"
        >
          <div class="mb-3 text-sm font-medium">
            {{ group.title || `标签组 ${index + 1}` }}
          </div>

          <ElCheckboxGroup v-model="selectedTagIds" class="flex flex-wrap gap-3">
            <ElCheckbox
              v-for="tag in group.tags || []"
              :key="tag.id"
              :label="tag.id"
              border
            >
              {{ tag.name }}
            </ElCheckbox>
          </ElCheckboxGroup>
        </div>
      </div>

      <ElEmpty v-else description="当前没有可选标签" />
    </div>
  </Modal>
</template>
