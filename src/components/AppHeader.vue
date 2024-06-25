<script setup lang="ts">
import { useLocale } from '@/composables/useLocale';
import { ODropdown, ODropdownItem } from '@opensig/opendesign';
import { computed } from 'vue';

const locales: { [key: string]: string } = {
  zh: '中文',
  en: 'English',
};
const { locale } = useLocale();
const currentLocale = computed(() => locales[locale.value] || '');

function changeLocale(arg: string) {
  locale.value = arg;
}
</script>

<template>
  <div class="header">
    <div class="header-component">
      <img src="" alt="openEuler logo">
      <a href="">{{ $t('header.user') }}</a>
      <a href="">{{ $t('header.developer') }}</a>
      <a href="">{{ $t('header.community') }}</a>
      <a href="">{{ $t('header.download') }}</a>
    </div>

    <div class="header-component" right>
      <ODropdown>
        {{ currentLocale }}
        <template #dropdown>
          <ODropdownItem v-for="(value, key) in locales" :key="value" :label="value" :value="key" @click="changeLocale(key as string)" />
        </template>
      </ODropdown>
      <!-- <div class="theme-icon"></div>
      <div class="avatar"></div> -->
      <span>user name</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  background-color: #FFF;
  justify-content: space-between;
}

.header-component {
  display: flex;
  align-items: center;
  margin-left: 13vw;
  gap: 2vw;

  img {
    height: 49px;
    width: 139px;
  }

  a {
    color: #000;
    font-size: 14px;
  }
}

.header-component[right] {
  margin-left: 0;
  margin-right: 13vw;
  gap: 0.8vw;

  p {
    font-family: inherit;
    font-size: 16px;
  }
}

.theme-icon {
  width: 24px;
  height: 24px;
  background-color: red;
}

.avatar {
  width: 32px;
  height: 32px;
  background-color: green;
}
</style>