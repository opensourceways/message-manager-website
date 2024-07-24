<script setup lang="ts">
import { OIcon, OLink } from '@opensig/opendesign';
import { computed } from 'vue';

const props = defineProps<{
  disabled?: boolean;
  iconSize?: string;
  hoverColor?: string;
}>();

const iconStyle = computed(() => ({
  '--link-icon-size': props.iconSize || '24px',
  '--link-color-hover': props.hoverColor || 'rgb(var(--o-kleinblue-6))',
}));
</script>

<template>
  <OLink :disabled="disabled" :style="iconStyle">
    <template #icon><slot name="icon" /></template>
    <slot />
    <template #suffix>
      <OIcon v-if="$slots.suffix">
        <slot name="suffix" />
      </OIcon>
    </template>
  </OLink>
</template>
