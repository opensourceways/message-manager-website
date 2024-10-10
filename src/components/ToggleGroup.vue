<script setup lang="ts">
import { ORadio, ORadioGroup, OToggle } from '@opensig/opendesign';
import { computed } from 'vue';

const props = defineProps<{
  options: (string | { value: string; label: string })[];
  modelValue: string;
}>();

defineEmits<{
  (event: 'update:modelValue', val: string): void;
}>();

const actualOptions = computed(() => {
  return props.options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });
});
</script>

<template>
  <ORadioGroup :model-value="modelValue" @change="$emit('update:modelValue', $event as string)" style="--radio-group-gap: 16px">
    <ORadio v-for="op in actualOptions" :key="op.value" :value="op.value">
      <template #radio="{ checked }">
        <OToggle :checked="checked" style="--toggle-radius: 4px">
          {{ op.label }}
        </OToggle>
      </template>
    </ORadio>
  </ORadioGroup>
</template>
