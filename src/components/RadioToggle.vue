<script setup lang="ts">
import { computed, nextTick, readonly, ref, watch } from 'vue';
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
  }
);

const emit = defineEmits<{
  (event: 'change', val: any): void;
  (event: 'confirmAdd', val: string, callback: () => void): void;
  (event: 'remove', val: { label: string; value: string | number }): void;
  (event: 'rename', oldName: string, newName: string): void;
  (event: 'update:modelValue', val: any): void;
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
const isAddingNew = ref(false);
const newTagContent = ref('');
const addNewTagRef = ref();

const addNew = () => {
  isAddingNew.value = true;
  nextTick(() => {
    const stop = onClickOutside(addNewTagRef.value.$el, (e: MouseEvent) => {
      e.stopPropagation();
      if (stop) {
        stop();
      }
      confirmAdd();
    });
  });
};

watch(
  isAddingNew,
  (val) => {
    if (val) {
      const nextCount = normalizedOptions.value.reduce((count, opt) => {
        if (opt.label.startsWith('我创建的')) {
          const num = Number.parseInt(opt.label.slice(4));
          if (!Number.isNaN(num)) {
            return Math.max(num, count) + 1;
          }
        }
        return count;
      }, 1);
      newTagContent.value = `我创建的${nextCount}`;
    }
    if (!val) {
      newTagContent.value = '';
    }
  },
  { immediate: true }
);

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus(),
};

const confirmAdd = () => {
  if (!newTagContent.value) {
    return;
  }
  emit('confirmAdd', newTagContent.value, () => {
    isAddingNew.value = false;
    newTagContent.value = '';
  });
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
  ev: MouseEvent
) => {
  if (!props.enableRenameTags || val.value !== radioVal.value) {
    cancel(val.value, ev);
    return;
  }
  ev.stopPropagation();
  ev.preventDefault();
  if (currentlyRenameTagIndex.value !== index) {
    const stop = onClickOutside(ev.currentTarget as HTMLElement, () => {
      if (stop) {
        stop();
      }
      confirmRename();
    });
    currentlyRenameTagIndex.value = index;
    renameContent.value = val.label;
  }
};

const confirmRename = () => {
  if (!props.enableRenameTags) {
    return;
  }
  if (typeof currentlyRenameTagIndex.value === 'number') {
    emit('rename', normalizedOptions.value[currentlyRenameTagIndex.value].label, renameContent.value);
  }
  currentlyRenameTagIndex.value = null;
};

const removeTag = (val: { label: string; value: string | number }) => {
  emit('remove', val);
};

defineExpose({
  addNew,
  isAddingNew: readonly(isAddingNew),
});
</script>

<template>
  <ORadioGroup v-model="radioVal" @change="changeRadioVal" style="--radio-group-gap: 0; row-gap: 8px">
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
    <ORadio v-for="(item, index) in normalizedOptions" @click.left="onClickLabel(item, index, $event)" :key="item.value" :value="item.value">
      <template #radio="{ checked }">
        <div class="toggle-item-wrapper" style="position: relative">
          <div v-if="enableDeleteTags" class="close-icon" @click.stop.prevent="removeTag({ ...item })">
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
    <ORadio ref="addNewTagRef" @click.stop.prevent="" v-if="isAddingNew" :value="false">
      <template #radio>
        <OTag style="--tag-bg-color: var(--o-color-fill1); --tag-bd-color: var(--o-color-fill1); --tag-height: var(--o-control_size-m)">
          <input v-focus v-model="newTagContent" class="input-text" type="text" @keydown.enter="confirmAdd" />
        </OTag>
      </template>
    </ORadio>
  </ORadioGroup>
</template>

<style lang="scss" scoped>
:deep(.o-toggle) {
  max-width: 176px;
}

.toggle-content {
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-text {
  border: none;
  outline: none;
  background-color: transparent;
  width: 90px;
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
