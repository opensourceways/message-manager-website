<script setup lang="ts">
import { computed } from 'vue';
import { OButton } from '@opensig/opendesign';

const props = withDefaults(defineProps<{
  disabaled?: boolean;
  round?: string;
  variant?: "outline" | "solid" | "text";

  color?: string;
  hoverColor?: string;
  activeColor?: string;
  bgHoverColor?: string;
  bgActiveColor?: string;
}>(), {
  variant: 'outline',
  round: 'pill'
});

const btnStyle = computed(() => ({
  '--btn-color': props.color || 'rgb(var(--o-kleinblue-6))',
  '--btn-color-hover': props.hoverColor || 'var(--o-color-white)',
  '--btn-color-active': props.activeColor || 'var(--o-color-white)',
  '--btn-bg-color-hover': props.color || 'rgb(var(--o-kleinblue-6))',
  '--btn-bg-color-active': props.color || 'rgb(var(--o-kleinblue-6))',
}));
</script>

<template>
  <OButton :style="btnStyle" :variant="variant" :round="round" :disabled="disabaled" :color="'primary'">
    <slot />
  </OButton>
</template>

<style scoped lang="scss">
.app-button {
  --btn-color: var(--o-kleinblue-6);
}
</style>
