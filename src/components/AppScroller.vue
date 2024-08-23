<script setup lang="ts">
import { OScroller } from '@opensig/opendesign';
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';
import { ref } from 'vue';

const emit = defineEmits<{
  (event: 'scrollBottom'): void
}>();

const wrapDiv = ref<HTMLDivElement>();

const onScroll = (event: Event) => {
  const el = event.target as HTMLDivElement;
  if (el.scrollHeight - Math.round(el.scrollTop) <= el.clientHeight) {
    emit('scrollBottom');
  }
};

onMounted(() => {
  const container = wrapDiv.value?.querySelector('.o-scroller-container') as HTMLDivElement;
  container && container.addEventListener('scroll', onScroll);
});

onUnmounted(() => {
  const container = wrapDiv.value?.querySelector('.o-scroller-container') as HTMLDivElement;
  container && container.removeEventListener('scroll', onScroll);
});

const scrollTop = () => {
  const container = wrapDiv.value?.querySelector('.o-scroller-container') as HTMLDivElement;
  container.scrollTop = 0;
}

defineExpose({
  scrollTop,
})
</script>

<template>
  <div ref="wrapDiv">
    <OScroller class="content" showType="always">
      <slot></slot>
    </OScroller>
  </div>
</template>

<style lang="scss" scoped>
.content {
  background-color: var(--o-color-fill2);
  padding: 12px;
  padding-bottom: 0;
  max-height: 200px;
}
</style>