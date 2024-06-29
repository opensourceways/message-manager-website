<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { OIconChecked } from '@opensig/opendesign';

const emit = defineEmits(['update:modelValue', 'onChange']);
const props = withDefaults(defineProps<{
  modelValue?: boolean;
  inputId?: string;
  isDisabled?: boolean;
  indeterminate?: boolean;
}>(), {
  modelValue: false,
  isDisabled: false,
});

const isChecked = computed(() => props.modelValue ?? false);

function onChange(event: Event) {
  const { checked } = (event.target as HTMLInputElement)
  emit('update:modelValue', checked)
  nextTick(() => emit('onChange', checked))
}
</script>

<template>
  <label
    class="o-checkbox"
    :class="{
      'o-checkbox-checked': isChecked,
      'o-checkbox-disabled': isDisabled,
      'o-checkbox-indeterminate': indeterminate,
    }"
    :for="inputId"
  >
    <div class="o-checkbox-wrap">
      <input :id="inputId" type="checkbox" :checked="isChecked" :disabled="isDisabled" @change="onChange" />
      <div class="o-checkbox-input-wrap">
        <span class="o-checkbox-input">
          <Transition name="o-fade-in">
            <span v-if="props.indeterminate" class="o-checkbox-input-icon-indeterminate"></span>
            <OIconChecked v-else-if="isChecked" />
          </Transition>
        </span>
      </div>
    </div>
  </label>
</template>
