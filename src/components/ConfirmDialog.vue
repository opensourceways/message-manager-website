<script setup lang="ts">
import { ODialog, type DialogActionT } from '@opensig/opendesign';

const emit = defineEmits<{
  (event: 'confirm'): void;
  (event: 'cancel'): void;
}>();
const props = defineProps<{
  show: boolean;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}>();

const actions: DialogActionT[] = [
  {
    id: 'cancel',
    label: props.confirmText || '确定',
    variant: 'solid',
    color: 'primary',
    size: 'large',
    round: 'pill',
    onClick: () => emit('confirm'),
  },
  {
    id: 'ok',
    label: props.cancelText || '取消',
    color: 'primary',
    variant: 'outline',
    round: 'pill',
    size: 'large',
    onClick: () => emit('cancel'),
  },
];
</script>

<template>
  <ODialog :maskClose="false" :visible="show" :actions="actions" size="small" style="--dlg-radius: 4px">
    <template #header>{{ title }}</template>
    <div style="display: flex; justify-content: center">
      {{ content }}
    </div>
  </ODialog>
</template>
