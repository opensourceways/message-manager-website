<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  disabled?: boolean;
  type: string;
  label: string;
}>();
const emit = defineEmits<{
  (event: 'perform'): void
}>();

const SRC = {
  default: `/src/assets/svg-icons/icon-${props.type}.svg`,
  active: `/src/assets/svg-icons/icon-${props.type}-active.svg`,
};

const src = ref(SRC.default);

const onHover = () => {
  if (props.disabled) {
    return;
  }
  src.value = SRC.active;
};
const onMouseLeave = () => {
  if (props.disabled) {
    return;
  }
  src.value = SRC.default;
};

const perform = () => {
  if (props.disabled) {
    return;
  }
  emit('perform');
};
</script>

<template>
  <div class="messages-operation" :diabled="disabled" @click="perform" @mouseenter="onHover" @mouseleave="onMouseLeave">
    <img :src="src" />
    {{ label }}
  </div>
</template>

<style scoped lang="scss">
.messages-operation {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    color: #002ea7;
  }

  &[diabled="true"] {
    opacity: 0.3;
    color: #000;
  }
}
</style>
