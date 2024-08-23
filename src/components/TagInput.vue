<script setup lang="ts">
import { OInput, OTag } from '@opensig/opendesign';
import { ref } from 'vue';

defineProps({
  placeholder: {
    type: String,
    default: ''
  }
});

const emit = defineEmits<{
  (event: 'change', val: string[]): void;
}>();

const val = ref('');

const tags = ref<string[]>([]);

const onEnter = (input: string) => {
  tags.value.push(input);
  emit('change', tags.value);
  val.value = '';
};

const onClose = (index: number) => {
  tags.value.splice(index, 1);
  emit('change', tags.value);
};
</script>

<template>
  <OInput v-model:model-value="val" @press-enter="onEnter" :placeholder="placeholder">
    <template #prefix>
      <div class="tag-wrap">
        <OTag closable @close="onClose(index)" v-for="(item, index) in tags" :key="item">{{ item }}</OTag>
      </div>
    </template>
    <template #suffix v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </template>
  </OInput>
</template>

<style lang="scss" scoped>
.tag-wrap {
  display: flex;

  & :not(:first-child) {
    margin-left: 4px;
  }
}
</style>
