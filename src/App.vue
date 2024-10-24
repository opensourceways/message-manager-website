<script setup lang="ts">
import { OScroller } from '@opensig/opendesign';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import { useTheme } from './composables/useTheme';
import { BAIDU_HM } from './data/config';

useTheme();

// -------------------- 埋点 --------------------
const initSensor = () => {
  // 百度统计
  const hm = document.createElement('script');
  hm.src = BAIDU_HM;
  const s = document.getElementsByTagName('HEAD')[0];
  s.appendChild(hm);
};
initSensor();
</script>

<template>
  <AppHeader />
  <OScroller show-type="hover">
    <main class="ly-main">
      <RouterView />
    </main>
    <AppFooter />
  </OScroller>
</template>

<style lang="scss">
#app {
  --color-primary: #027ef2;
  background-color: var(--o-color-fill1);

  min-width: 1200px;

  --layout-header-height: 80px;
  --layout-header-zIndex: 101;
  --layout-header-max-width: 1440px;
  --layout-header-padding: 12px;

  --layout-content-max-width: 1440px;
  --layout-content-padding: 12px;

  --layout-footer-height: 300px;

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
    --layout-header-padding: 16px;

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
  --scrollbar-height: calc(100vh - var(--layout-header-height) * 2 - 10px);
  :deep(.o-scroller-container) {
    scroll-padding-top: var(--layout-header-height);
  }
}

.ly-main {
  padding-top: var(--layout-header-height);
  min-height: calc(var(--layout-content-min-height) + var(--layout-header-height));
  background-color: var(--o-color-fill1);

  @include respond-to('phone') {
    padding: 0;
  }
}

.ly-footer {
  height: var(--layout-footer-height);
  background-color: var(--o-color-fill1);
}
</style>
