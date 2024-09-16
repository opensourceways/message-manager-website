<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { onClickOutside, useVModel } from '@vueuse/core';
import { ODivider, OIcon, ORadio, ORadioGroup, OTag, OToggle } from '@opensig/opendesign';

import IconClose from '~icons/app/icon-close.svg';

const props = withDefaults(
  defineProps<{
    /** 默认标签项（不可重命名） */
    defaultOptions?: (string | { label: string; value: string | number })[];
    /** 标签项 */
    options?: (string | { label: string; value: string | number })[];
    /** 选中标签值 */
    modelValue?: string | number;
    /** 新增标签的开关 */
    addNew?: boolean;
    /** 是否允许重命名标签 */
    enableRenameTags?: boolean;
    /** 是否允许删除标签 */
    enableDeleteTags?: boolean;
    /** 是否允许取消选中 */
    enableCancelSelect?: boolean;
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
  (event: 'remove', val: string | number, index: number): void;
  (event: 'rename', val: { label: string; value: string | number }, newName: string): void;
  (event: 'update:modelValue', val: any): void;
  (event: 'update:addNew', val: any): void;
}>();

const radioVal = useVModel(props, 'modelValue', emit);

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

const changeRadioVal = (val: string | number | boolean) => {
  emit('change', val);
};

const clickOutsideCancelFnMap = new Map<string | number, () => void>();

/**
 * 取消当前选中
 * @param value 点击标签的值
 * @param ev 鼠标事件
 */
const cancel = (value: string | number, ev?: MouseEvent) => {
  if (props.enableCancelSelect && radioVal.value === value) {
    ev?.stopPropagation();
    ev?.preventDefault();
    radioVal.value = '';
    emit('change', '');
  }
};

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
const currentlyRenameTagIndex = ref<number | null>();

const onClickLabel = (
  val: {
    label: string;
    value: any;
  },
  index: number,
  ev?: MouseEvent
) => {
  if (!props.enableRenameTags) {
    cancel(val.value, ev);
    return;
  }
  if (val.value !== radioVal.value) {
    cancel(val.value, ev);
    return;
  }
  ev?.stopPropagation();
  ev?.preventDefault();
  currentlyRenameTagIndex.value = index;
  renameContent.value = val.label;
};

const confirmRename = () => {
  if (!props.enableRenameTags) {
    return;
  }
  if (typeof currentlyRenameTagIndex.value === 'number') {
    emit('rename', normalizedOptions.value[currentlyRenameTagIndex.value as number], renameContent.value);
  }
  currentlyRenameTagIndex.value = null;
};

const removeTag = (val: string | number, index: number) => {
  emit('remove', val, index);
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
  clickOutsideCancelFnMap.set(
    index,
    onClickOutside(el, () => {
      // 取消重命名
      currentlyRenameTagIndex.value = null;
      renameContent.value = '';
    }) as () => void
  );
};

onBeforeUnmount(() => {
  for (const fn of clickOutsideCancelFnMap.values()) {
    fn();
  }
  clickOutsideCancelFnMap.clear();
});
</script>

<template>
  <ORadioGroup v-model="radioVal" @change="changeRadioVal" style="--radio-group-gap: 8px; row-gap: 8px">
    <template v-if="defaultOptions.length">
      <ORadio v-for="item in normalizedDefaultOptions" :key="item.value" :value="item.value">
        <template #radio="{ checked }">
          <OToggle :checked="checked" style="--toggle-radius: 4px">
            <p class="toggle-content">
              {{ item.label }}
            </p>
          </OToggle>
        </template>
      </ORadio>
    </template>
    <ODivider v-if="normalizedDefaultOptions.length && normalizedOptions.length" direction="v" style="height: var(--toggle-size)" />
    <ORadio
      v-for="(item, index) in normalizedOptions"
      @click.left="onClickLabel(item, index, $event)"
      :ref="(el) => setFilterTagClickOutside(el, index)"
      :key="item.value"
      :value="item.value"
    >
      <template #radio="{ checked }">
        <div class="toggle-item-wrapper" style="position: relative">
          <div v-if="enableDeleteTags" class="close-icon" @click.stop.prevent="removeTag(item.value, index)">
            <OIcon style="color: var(--o-color-fill2)"><IconClose /></OIcon>
          </div>
          <OToggle v-if="currentlyRenameTagIndex !== index" :checked="checked" style="--toggle-radius: 4px">
            <p class="toggle-content">
              {{ item.label }}
            </p>
          </OToggle>
          <OTag v-else style="--tag-bg-color: var(--o-color-fill2); --tag-bd-color: var(--o-color-primary1); --tag-height: var(--o-control_size-m)">
            <input v-focus v-model="renameContent" class="input-text" type="text" @keydown.enter="confirmRename" />
          </OTag>
        </div>
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
.toggle-content {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 176px;
}

.input-text {
  border: none;
  outline: none;
  background-color: transparent;
  width: 90px;
  max-width: 176px;
}

.toggle-item-wrapper {
  @include text1;

  .close-icon {
    display: none;
    background-color: var(--o-color-control2);
    width: 1em;
    height: 1em;
    border-radius: 50%;
    position: absolute;
    right: -0.5em;
    top: -0.5em;
  }

  &:hover .close-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
