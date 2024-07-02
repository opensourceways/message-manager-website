<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import { OBreadcrumb, OBreadcrumbItem } from '@opensig/opendesign';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';

const route = useRoute();

const breadcrumbs = ref<{ text: string; name: string }[]>([])

watch(() => route.name, name => {
  switch (name) {
    case 'config':
      breadcrumbs.value = [
        { text: '消息中心', name: 'home' },
        { text: '消息订阅设置', name: 'config' },
      ];
      break;
    case 'home':
      breadcrumbs.value = [];
      break;
  }
})
</script>

<template>
  <AppHeader class="ly-header"/>
  <div class="container">
    <div class="inner-container">
      <OBreadcrumb>
        <OBreadcrumbItem v-for="(item, index) in breadcrumbs" :key="index" :to="{ name: item.name }" >
          {{ item.text }}
        </OBreadcrumbItem>
      </OBreadcrumb>
      <div class="page-body">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$default-page-body-width: 74vw;
$default-page-body-height: 900px;
.page-body {
  width: $default-page-body-width;
  height: $default-page-body-height;
  background-color: #FFF;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  padding: calc($default-page-body-height * 0.04) calc($default-page-body-width * 0.02);
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
