<script setup lang="ts">
const props = withDefaults(defineProps<{
  color?: string;
  width?: string | number;
  widthUnit?: string;
  direction?: 'horizontal' |'vertical';
  length?: string;
}>(), {
  color: 'rgba(0, 0, 0, 0.1)',
  width: 1,
  direction: 'horizontal',
  widthUnit: 'px',
  length: '100%'
})

const lineWidth = props.width + props.widthUnit;
</script>

<template>
  <div :style="{ backgroundColor: color, width: direction === 'horizontal' ? length : lineWidth, height: direction === 'vertical' ? length : lineWidth }"></div>
</template>