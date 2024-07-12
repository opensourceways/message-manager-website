<script setup lang="ts">
import { OInput } from '@opensig/opendesign';
import { ref } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = withDefaults(
  defineProps<{
    warningText: string;
    modelValue: string;
    placeholder?: string;
    clearable?: boolean;
    noEmpty?: boolean;
    regExp?: RegExp;
    isPhoneNum?: boolean;
    validator?: (value: string) => boolean;
  }>(),
  {
    clearable: true,
  }
);

const isValid = ref(true);

const doValidate = (value?: string) => {
  value ??= props.modelValue;
  if (props.validator && !props.validator(value)) {
    isValid.value = false;
    return false;
  }
  if (props.regExp && !props.regExp.test(value)) {
    isValid.value = false;
    return false;
  }
  if (props.noEmpty && !value.trim()) {
    isValid.value = false;
    return false;
  }
  isValid.value = true;
  return true;
};

function onInput(value: string) {
  emit('update:modelValue', value);
}

defineExpose({
  isValid,
  doValidate,
});
</script>

<template>
  <div>
    <OInput
      @input="onInput"
      :clearable="clearable"
      :modelValue="modelValue"
      variant="outline"
      @blur="doValidate"
      :color="isValid ? 'normal' : 'danger'"
      :placeholder="placeholder"
    >
      <template #prepend v-if="isPhoneNum">
        <span style="padding: 0 8px 0 7px">+86</span>
      </template>
    </OInput>
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
  color: #e60012;
}
</style>
