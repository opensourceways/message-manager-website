<script setup lang="ts">
import { ODialog, type DialogActionT } from '@opensig/opendesign';
import { useVModel } from '@vueuse/core';

const emit = defineEmits<{
  (event: 'confirm'): void;
  (event: 'cancel'): void;
  (event: 'update:show', val: boolean): void;
}>();
const props = defineProps<{
  show: boolean;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}>();

const visible = useVModel(props, 'show', emit);

const actions: DialogActionT[] = [
  {
    id: 'cancel',
    label: props.confirmText || '确定',
    variant: 'solid',
    color: 'primary',
    size: 'large',
    round: 'pill',
    onClick: () => {
      emit('confirm');
      visible.value = false;
    },
  },
  {
    id: 'ok',
    label: props.cancelText || '取消',
    color: 'primary',
    variant: 'outline',
    round: 'pill',
    size: 'large',
    onClick: () => {
      emit('cancel');
      visible.value = false;
    },
  },
];
</script>

<template>
  <ODialog :maskClose="false" v-model:visible="visible" :actions="actions" size="small" style="--dlg-radius: 4px">
    <template #header>{{ title }}</template>
    <div style="display: flex; justify-content: center">
      {{ content }}
    </div>
  </ODialog>
</template>
