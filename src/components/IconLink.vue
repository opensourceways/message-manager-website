<script setup lang="ts">
import { OIcon, OLink } from '@opensig/opendesign';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  disabled?: boolean;
  iconSize?: string;
  hoverColor?: string;
  labelClassNames?: string[];
}>(), {
  iconSize: '24px',
  hoverColor: 'rgb(var(--o-kleinblue-6))',
  labelClassNames: () => ([]),
});

const iconStyle = computed(() => ({
  '--link-icon-size': props.iconSize,
  '--link-color-hover': props.hoverColor,
}));
</script>

<template>
  <OLink :disabled="disabled" :style="iconStyle" :class="labelClassNames">
    <template #icon><slot name="prefix" /></template>
    <slot />
    <template v-if="$slots.suffix" #suffix>
      <OIcon>
        <slot name="suffix" />
      </OIcon>
    </template>
  </OLink>
</template>
