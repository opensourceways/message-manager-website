<script setup lang="ts">
import { OInput } from '@opensig/opendesign';
import { nextTick, ref } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = withDefaults(defineProps<{
  warningText: string;
  modelValue: string;
  placeholder?: string;
  clearable?: boolean;
  noEmpty?: boolean;
  regExp?: RegExp;
  validator?: (value: string) => boolean;
}>(), {
  clearable: true,
});

const isValid = ref(true);

function onChange(value: string) {
  emit('update:modelValue', value);
}

function onBlur() {
  nextTick(() => {
    if (props.noEmpty) {
      isValid.value = !!props.modelValue.trim();
      return;
    }
    if (props.regExp) {
      isValid.value = props.regExp.test(props.modelValue);
      return;
    }
    if (props.validator) {
      isValid.value = props.validator(props.modelValue)
    }
  });
}
</script>

<template>
  <div>
    <OInput
      @change="onChange"
      :clearable="clearable"
      :modelValue="modelValue"
      variant="outline"
      @blur="onBlur"
      :color="isValid ? 'normal' : 'danger'"
      :placeholder="placeholder"
    />
    <p v-show="!isValid">{{ warningText }}</p>
  </div>
</template>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

p {
  font-size: 12px;
  margin-left: 16px;
  color: #E60012
}
</style>