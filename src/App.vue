<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { OScroller, OConfigProvider } from '@opensig/opendesign';
import zhCN from '@opensig/opendesign/es/locale/lang/zh-cn';
import enUS from '@opensig/opendesign/es/locale/lang/en-us';

import { useLocale } from '@/composables/useLocale';
</script>

<template>
  <!-- <AppHeader class="ly-header" /> -->
  <OScroller show-type="hover">
    <main class="ly-main">
      <RouterView />
    </main>
    <AppFooter class="ly-footer" />
  </OScroller>
</template>

<style lang="scss">
#app {
  --color-primary: #027ef2;

  min-width: 1200px;

  --layout-header-height: 64px;
  --layout-header-zIndex: 101;
  --layout-header-max-width: 1440px;
  --layout-header-padding: 12px;

  --layout-content-max-width: 1440px;
  --layout-content-padding: 12px;

  --layout-footer-height: 80px;

  --layout-content-min-height: calc(100vh - var(--layout-header-height) - var(--layout-footer-height));

  @include respond-to('<=laptop') {
    --layout-header-max-width: 100%;
    --layout-header-padding: 5%;

    --layout-content-max-width: 100%;
    --layout-content-padding: 5%;
  }

  @include respond-to('<=pad') {
    --layout-header-height: 48px;
    --layout-header-padding: 32px;

    --layout-content-padding: 32px;

    --layout-footer-height: 64px;
  }

  @include respond-to('phone') {
    --layout-header-padding: 24px;

    --layout-content-padding: 24px;

    --layout-footer-height: 48px;
  }
}
</style>

<style lang="scss" scoped>
.ly-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: var(--layout-header-height);
  z-index: var(--layout-header-zIndex);
}

.o-scroller {
  height: 100vh;
  background-color: var(--o-color-fill1);
  --scrollbar-height: calc(100vh - var(--layout-header-height) * 2 - 10px);
  :deep(.o-scroller-container) {
    scroll-padding-top: var(--layout-header-height);
  }
}

.ly-main {
  padding-top: var(--layout-header-height);
  min-height: calc(var(--layout-content-min-height) + var(--layout-header-height));
  background-color: var(--o-color-fill1);
}

.ly-footer {
  height: var(--layout-footer-height);
  background-color: var(--o-color-fill1);
}
</style>
