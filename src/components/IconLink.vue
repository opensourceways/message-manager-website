<script setup lang="ts">
import { OIcon, OLink } from '@opensig/opendesign';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  iconWidth?: string;
  disabled?: boolean;
  iconSize?: string;
  hoverColor?: string;
  color?: string;
  labelClassNames?: string[];
}>(), {
  iconWidth: '',
  iconSize: '24px',
  hoverColor: 'rgb(var(--o-kleinblue-6))',
  labelClassNames: () => ([]),
});

const iconStyle = computed(() => ({
  '--link-icon-size': props.iconSize,
  '--link-color-hover': props.hoverColor,
  '--link-color': props.color,
}));
</script>

<template>
  <OLink :disabled="disabled" :style="iconStyle" :class="labelClassNames">
    <template #icon>
      <OIcon :style="{ width: iconWidth }">
        <slot name="prefix"></slot>
      </OIcon>
    </template>
    <slot></slot>
    <template v-if="$slots.suffix" #suffix>
      <OIcon :style="{ width: iconWidth }">
        <slot name="suffix"></slot>
      </OIcon>
    </template>
  </OLink>
</template>
