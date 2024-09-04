<script setup lang="ts">
import { ODivider, ORadio, ORadioGroup, OTag, OToggle } from '@opensig/opendesign';
import { onClickOutside, useVModel } from '@vueuse/core';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 默认标签项（不可重命名） */
    defaultOptions?: (string | { label: string; value: any })[];
    /** 标签项 */
    options?: (string | { label: string; value: any })[];
    /** 选中标签值 */
    modelValue?: string | number;
    /** 新增标签的开关 */
    addNew?: boolean;
    /** 是否允许重命名标签 */
    enableRenameTags?: boolean;
  }>(),
  {
    options: (): any[] => [],
    defaultOptions: (): any[] => [],
    modelValue: '',
    addNew: false,
  }
);

const emit = defineEmits<{
  (event: 'change', val: any): void;
  (event: 'confirmAdd', val: string): void;
  (event: 'update:modelValue', val: any): void;
  (event: 'update:addNew', val: any): void;
}>();

const normalizedOptions = computed(() =>
  props.options.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    return item;
  })
);

const normalizedDefaultOptions = computed(() =>
  props.defaultOptions.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    return item;
  })
);

const radioVal = useVModel(props, 'modelValue', emit);

const clickOutsideCancelFnMap = new Map<string | number, () => void>();

// ----------------添加新标签----------------
const isAddNew = useVModel(props, 'addNew', emit);
const newTagContent = ref('');
watch(isAddNew, (val) => {
  if (!val) {
    newTagContent.value = '';
  }
});

const setAddNewTagClickOutside = (el: any) => {
  if (!el) {
    clickOutsideCancelFnMap.get('_')?.();
    clickOutsideCancelFnMap.delete('_');
    return;
  }
  clickOutsideCancelFnMap.set('_', onClickOutside(el, () => (isAddNew.value = false)) as () => void);
};

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus(),
};

const confirmAdd = () => {
  emit('confirmAdd', newTagContent.value);
  isAddNew.value = false;
  newTagContent.value = '';
};


// ----------------重命名标签----------------
const renameContent = ref('');
const currentlyRenameTagIndex = ref<number| null>();

const rename = (ev: Event, index: number) => {
  if (!props.enableRenameTags) {
    return;
  }
  ev.preventDefault();
  currentlyRenameTagIndex.value = index;
};

const confirmRename = (index: number) => {
  if (!props.enableRenameTags) {
    return;
  }
  // todo rename
  console.log(index);
  currentlyRenameTagIndex.value = null;
};

const setFilterTagClickOutside = (el: any, index: number) => {
  if (!props.enableRenameTags) {
    return;
  }
  if (!el) {
    clickOutsideCancelFnMap.get(index)?.();
    clickOutsideCancelFnMap.delete(index);
    return;
  }
  clickOutsideCancelFnMap.set(index, onClickOutside(el, () => {
    // 取消重命名
    currentlyRenameTagIndex.value = null;
    renameContent.value = '';
  }) as () => void);
};

onBeforeUnmount(() => {
  for (const fn of clickOutsideCancelFnMap.values()) {
    fn();
  }
  clickOutsideCancelFnMap.clear();
});
</script>

<template>
  <ORadioGroup v-model="radioVal" @change="$emit('change', $event)" style="--radio-group-gap: 8px; row-gap: 8px">
    <template v-if="defaultOptions.length">
      <ORadio v-for="item in normalizedDefaultOptions" :key="item.value" :value="item.value">
        <template #radio="{ checked }">
          <OToggle :checked="checked" style="--toggle-radius: 4px">
            {{ item.label }}
          </OToggle>
        </template>
      </ORadio>
      <ODivider direction="v" style="height: var(--toggle-size)"></ODivider>
    </template>
    <ORadio
      v-for="(item, index) in normalizedOptions"
      @click.right="rename($event, index)"
      :ref="(el) => setFilterTagClickOutside(el, index)"
      :key="item.value"
      :value="item.value"
    >
      <template #radio="{ checked }">
        <OToggle v-if="currentlyRenameTagIndex !== index" :checked="checked" style="--toggle-radius: 4px">
          {{ item.label }}
        </OToggle>
        <OTag v-else style="--tag-bg-color: var(--o-color-fill1); --tag-bd-color: var(--o-color-fill1); --tag-height: var(--o-control_size-m)">
          <input v-focus v-model="renameContent" class="input-text" type="text" @keydown.enter="() => confirmRename(index)" />
        </OTag>
      </template>
    </ORadio>
    <ORadio :ref="setAddNewTagClickOutside" v-if="isAddNew" :value="false">
      <template #radio>
        <OTag style="--tag-bg-color: var(--o-color-fill1); --tag-bd-color: var(--o-color-fill1); --tag-height: var(--o-control_size-m)">
          <input v-focus v-model="newTagContent" class="input-text" type="text" @keydown.enter="confirmAdd" />
        </OTag>
      </template>
    </ORadio>
  </ORadioGroup>
</template>

<style lang="scss" scoped>
.input-text {
  border: none;
  outline: none;
  background-color: var(--o-color-fill1);
  width: 90px;
}
</style>
