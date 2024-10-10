<script setup lang="ts">
import { OIcon } from '@opensig/opendesign';

import { useTheme } from '@/composables/useTheme';

import IconSun from '~icons/app/icon-sun.svg';
import IconMoon from '~icons/app/icon-moon.svg';

const { changeTheme, isLight, isDark } = useTheme();
</script>

<template>
  <div class="header-theme" @click="changeTheme">
    <OIcon class="theme-icon">
      <IconMoon v-if="isLight" />
      <IconSun v-if="isDark" />
    </OIcon>
  </div>
</template>

<style lang="scss" scoped>
.header-theme {
  margin-right: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  width: 24px;
}

.theme-icon {
  color: var(--o-color-info1);
  width: 24px;
  cursor: pointer;
}
</style>
