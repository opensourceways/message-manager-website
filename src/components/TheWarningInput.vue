<script setup lang="ts">
// TODO: 组件不以The开头
import { OInput } from '@opensig/opendesign';
import { nextTick, ref } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = withDefaults(defineProps<{
  warningText: string;
  modelValue: string;
  placeholder?: string;
  clearable?: boolean;
  validator: (value: string) => boolean;
}>(), {
  clearable: false,
});

const isValid = ref(true);
// TODO:建议使用函数表达式定义函数
function onChange(value: string) {
  emit('update:modelValue', value);
}
// TODO:建议使用函数表达式定义函数
function onBlur() {
  nextTick(() => isValid.value = props.validator(props.modelValue))
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