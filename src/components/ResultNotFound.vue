<script setup lang="ts">
import ContentWrapper from '@/components/ContentWrapper.vue';
import { OButton, OResult } from '@opensig/opendesign';

</script>

<template>
  <ContentWrapper class="result-404">
    <OResult>
      <template #extra>
        <RouterLink to="/">
          <OButton variant="solid" color="primary">返回首页</OButton>
        </RouterLink>
      </template>
    </OResult>
  </ContentWrapper>
</template>

<style lang="scss" scoped>
.result-404 {
  width: 100%;
  height: var(--layout-content-min-height);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
