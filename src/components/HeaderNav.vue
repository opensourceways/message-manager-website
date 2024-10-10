<script setup lang="ts">
import { ref } from 'vue';
import { navs } from '@/data/nav';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useLocale } from '@/composables/useLocale';

const route = useRoute();
const router = useRouter();
const { isZh, locale } = useLocale();

// -------------------- hover事件 --------------------
const activeIndex = ref(-1);
const onMouseEnter = (idx: number) => {
  activeIndex.value = idx;
};

const onMouseLeave = () => {
  activeIndex.value = -1;
};

// -------------------- 选中事件 --------------------
const selectedIndex = computed(() => {
  let idx = -1;

  if (route.path === `/${locale.value}/`) {
    idx = 0;
    return idx;
  }

  if (route.path.includes('/field')) {
    idx = 1;
    return idx;
  }

  if (route.path.includes('/rpm')) {
    idx = 2;
    return idx;
  }

  if (route.path.includes('/image')) {
    idx = 3;
    return idx;
  }

  if (route.path.includes('/epkg')) {
    idx = 4;
    return idx;
  }
  if (route.path.includes('/oepkg')) {
    idx = 5;
    return idx;
  }

  if (route.path.includes('/upstream')) {
    idx = 6;
    return idx;
  }

  return idx;
});

// 导航跳转
const jumpTo = (href: string) => {
  router.push(`/${locale.value}` + href);
};
</script>

<template>
  <nav class="header-nav">
    <ul class="nav-list">
      <li
        v-for="(item, idx) in navs"
        :key="item.id"
        :id="'e2e_headerNav_' + item.id"
        class="nav-item"
        :class="{
          'is-selected': selectedIndex === idx,
          'is-active': activeIndex === idx,
        }"
        @mouseenter="onMouseEnter(idx)"
        @mouseleave="onMouseLeave"
      >
        <span @click="jumpTo(item.href)" class="nav-item-link">{{ isZh ? item.label.zh : item.label.en }}</span>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
.header-nav {
  height: 100%;
}

.nav-list {
  display: flex;
  height: 100%;
}

.nav-item {
  position: relative;
  height: 100%;
  @include text1;
  cursor: pointer;
  color: var(--o-color-info1);
  pointer-events: auto;
  transition: color var(--o-duration-s) var(--o-easing-standard);
  margin-left: 32px;
  .nav-item-link {
    color: var(--o-color-info1);
    height: 100%;
    display: flex;
    align-items: center;
    transition: color var(--o-duration-s) var(--o-easing-standard);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background-color: var(--o-color-primary1);
    transition: opacity var(--o-duration-m2) var(--o-easing-standard);
    opacity: 0;
  }

  &.is-active,
  &.is-selected {
    span {
      color: var(--o-color-primary1);
    }
  }

  &.is-selected {
    font-weight: 500;
    &::after {
      opacity: 1;
    }
  }
}
</style>
