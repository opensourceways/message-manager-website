<script setup lang="ts">
import { ODialog, type DialogActionT } from '@opensig/opendesign';

const emit = defineEmits<{
  (event: 'confirm'): void;
  (event: 'cancel'): void;
}>();
defineProps<{
  show: boolean;
  title: string;
  content: string;
}>();

const actions: DialogActionT[] = [
  {
    id: 'cancel',
    label: '确定',
    size: 'large',
    round: 'pill',
    onClick: () => emit('confirm'),
  },
  {
    id: 'ok',
    label: '取消',
    color: 'primary',
    variant: 'solid',
    round: 'pill',
    size: 'large',
    onClick: () => emit('cancel'),
  },
];
</script>

<template>
  <ODialog :visible="show" :actions="actions" size="small">
    <template #header>{{ title }}</template>
    <div style="display: flex; justify-content: center">
      {{ content }}
    </div>
  </ODialog>
</template>
