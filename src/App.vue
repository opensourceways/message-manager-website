<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import { OBreadcrumb, OBreadcrumbItem } from '@opensig/opendesign';
import useBreadcrumbStore from './stores/breadcrumb';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

const bcStore = useBreadcrumbStore();
const route = useRoute();

watch(() => route.name, name => {
  const index = bcStore.breadcrumbs.findIndex(item => item.name === name)
  if (index > -1) {
    if (index < bcStore.breadcrumbs.length - 1) {
      if (index === 0) {
        bcStore.clear();
        return;
      }
      bcStore.breadcrumbs.splice(index + 1);
    }
  }
})
</script>

<template>
  <AppHeader class="ly-header"/>
  <div class="container">
    <div class="inner-container">
      <OBreadcrumb>
        <OBreadcrumbItem v-for="(item, index) in bcStore.breadcrumbs" :key="index" :to="{ name: item.name }" >
          {{ item.text }}
        </OBreadcrumbItem>
      </OBreadcrumb>
      <RouterView />
    </div>
  </div>
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
.container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
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
  padding-top: var(--layout-header-height);
  min-height: calc(var(--layout-content-min-height) + var(--layout-header-height));
  background-color: var(--o-color-fill1);
}

.ly-footer {
  height: var(--layout-footer-height);
  background-color: var(--o-color-fill1);
}
</style>
