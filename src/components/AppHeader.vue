<script setup lang="ts">
import { OPENEULER } from '@/data/config';

import openeulerLogo from '@/assets/svg-icons/logo.svg';
import openeulerLogoDark from '@/assets/openeuler-logo-dark.svg';

import AppLogin from './AppLogin.vue';
import HeaderTheme from './HeaderTheme.vue';
import { useTheme } from '@/composables/useTheme';

const { isDark } = useTheme();
</script>

<template>
  <div class="header-wrap">
    <div class="header-content">
      <div class="header-left">
        <div class="logo">
          <a target="_blank" :href="`${OPENEULER}/zh/`" class="community-logo" rel="noopener noreferrer">
            <img :src="isDark ? openeulerLogoDark : openeulerLogo" />
          </a>
        </div>
      </div>
      <div class="header-right">
        <HeaderTheme />
        <AppLogin />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-wrap {
  position: sticky;
  top: 0;
  height: var(--layout-header-height);
  z-index: 101;
  background: var(--o-color-fill2);
  padding-left: var(--layout-content-padding);
  padding-right: var(--layout-content-padding);

  .header-content {
    @include respond-to('>laptop') {
      margin: 0 auto;
      padding-left: var(--layout-content-padding);
      padding-right: var(--layout-content-padding);
    }
    display: flex;
    align-items: center;
    height: 100%;
    max-width: 1440px;
    justify-content: space-between;
    .logo-text {
      @include h4;
      color: #000;
      cursor: pointer;
      font-weight: bold;
    }
    .header-left,
    .header-right {
      height: 100%;
      display: flex;
      align-items: center;
      animation: anim-header-trans-in var(--o-duration-xl);
    }
  }
  .logo {
    display: flex;
    align-items: center;
  }
  .community-logo {
    img {
      height: 32px;
      width: 139px;
    }
  }
}

.login {
  .icon {
    font-size: var(--o-font_size-h4);
    color: var(--o-color-info1);
    cursor: pointer;
  }
}
</style>
@/stores/common
