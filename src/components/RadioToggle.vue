<script setup lang="ts">
import { ORadio, ORadioGroup, OTag, OToggle } from '@opensig/opendesign';
import { useVModel } from '@vueuse/core';
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    options?: (string | { label: string; value: any })[];
    modelValue?: string | number;
    addNew?: boolean;
  }>(),
  {
    options: (): any[] => [],
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

const val = useVModel(props, 'modelValue', emit);
const isAddNew = useVModel(props, 'addNew', emit);

const newTagContent = ref('');

const confirmAdd = () => {
  emit('confirmAdd', newTagContent.value);
  isAddNew.value = false;
  newTagContent.value = '';
};
</script>

<template>
  <ORadioGroup v-model="val" @change="$emit('change', $event)" style="--radio-group-gap: 8px; row-gap: 8px">
    <ORadio v-for="item in normalizedOptions" :key="item.value" :value="item.value">
      <template #radio="{ checked }">
        <OToggle :checked="checked" style="--toggle-radius: 4px">
          {{ item.label }}
        </OToggle>
      </template>
    </ORadio>
    <ORadio v-if="isAddNew" :value="false">
      <template #radio>
        <OTag style="--tag-bg-color: var(--o-color-fill1); --tag-bd-color: var(--o-color-fill1); --tag-height: var(--o-control_size-m)">
          <input v-model="newTagContent" class="input-text" type="text" @keydown.enter="confirmAdd">
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