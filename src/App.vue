<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { OBreadcrumb, OBreadcrumbItem, OScroller } from '@opensig/opendesign';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';

const route = useRoute();

const breadcrumbs = ref<{ text: string; name: string }[]>([]);

watch(
  () => route.name,
  (name) => {
    switch (name) {
      case 'settings':
        breadcrumbs.value = [
          { text: '消息中心', name: 'home' },
          { text: '消息订阅设置', name: 'settings' },
        ];
        break;
      case 'home':
        breadcrumbs.value = [];
        break;
    }
  }
);
</script>

<template>
  <AppHeader />
  <OScroller show-type="hover">
    <div style="height: 26px;"></div>
    <main class="ly-main">
      <div class="inner-container">
        <OBreadcrumb>
          <OBreadcrumbItem v-for="(item, index) in breadcrumbs" :key="index" :to="{ name: item.name }">
            {{ item.text }}
          </OBreadcrumbItem>
        </OBreadcrumb>
        <RouterView />
      </div>
    </main>
    <AppFooter />
  </OScroller>
</template>

<style lang="scss">
.page-body {
  width: 74vw;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  padding: calc(900px * 0.04) calc(74vw * 0.02);
}
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
.inner-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

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
  display: flex;
  justify-content: center;
  padding-top: var(--layout-header-height);
  min-height: calc(var(--layout-content-min-height) + var(--layout-header-height));
  background-color: var(--o-color-fill1);
}

.ly-footer {
  height: var(--layout-footer-height);
  background-color: var(--o-color-fill1);
}
</style>
