<script setup lang="ts">
import { ref } from 'vue';
import { OIcon, OPopover } from '@opensig/opendesign';
import IconTip from '~icons/app/icon-tip.svg';

defineProps<{
  content: string;
  tip?: string;
}>();

const iconRef = ref();
</script>

<template>
  <div class="text-wrap">
    <p>{{ content }}</p>
    <OIcon class="icon" ref="iconRef">
      <slot name="icon">
        <IconTip />
      </slot>
    </OIcon>
    <OPopover :target="iconRef" trigger="hover">
      <slot name="tip">
        <p class="tip-content">{{ tip }}</p>
      </slot>
    </OPopover>
  </div>
</template>

<style lang="scss" scoped>
.text-wrap {
  --content-tip-gap: 10px;
  --content-font-size: 16px;
  --content-color: var(--o-color-info1);
  --icon-opacity: 0.3;
  --tip-icon-size: 16px;
  display: flex;
  align-items: center;

  & > p {
    margin-right: var(--content-tip-gap);
    font-size: var(--content-font-size);
    color: var(--content-color);
  }

  .icon {
    cursor: pointer;
    opacity: var(--icon-opacity);
    font-size: var(--tip-icon-size);
  }
}

.tip-content {
  @include tip1;
}
</style>