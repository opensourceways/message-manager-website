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
.active {
  color: var(--o-color-primary1);
}

.select-icon {
  font-size: 24px;
}

.filter-icon {
  font-size: 24px;
}

.back-btn {
  --btn-bg-color-active: transparent;
  --btn-padding: 0;
  --btn-gap: 16px;
}

.header-wrap {
  height: var(--layout-header-height);
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 101;
  background: var(--o-color-fill2);
  
  @include respond-to('phone') {
    box-shadow: var(--o-shadow-1);
  }

  // min-width: 1440px;
  .header-content {
    display: flex;
    align-items: center;
    height: 100%;
    max-width: 1504px;
    padding: 0 44px;
    justify-content: space-between;
    margin: 0 auto;
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

:deep(.search-box) {
  .search-input {
    width: 380px;
  }
  .recommend {
    top: 40px;
  }
}

.header-logo {
  display: flex;
  align-items: center;
  height: 100%;

  a {
    display: flex;
    align-items: center;
    .community-logo {
      height: 18px;
    }
  }
}

.header-lang {
  height: 100%;
  display: flex;
  align-items: center;
  .lang {
    @include tip1;
    color: var(--o-color-info2);
    margin-right: 4px;
  }
  .o-dropdown {
    height: 100%;
  }
  .info-wrap {
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .o-dropdown-item {
    @include text1;
    width: 136px;
    white-space: nowrap;
  }
}

.opt-user {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  .opt-info {
    display: flex;
    align-items: center;
    .opt-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      vertical-align: middle;
      /* @media (max-width: 1100px) {
        width: 28px;
        height: 28px;
      } */
    }
    .opt-name {
      color: var(--o-color-text2);
      margin-left: 8px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 72px;
      line-height: var(--o-line-height-h8);
      /* @media (max-width: 1100px) {
        display: none;
      } */
    }
  }
  &:hover {
    .menu-list {
      display: block;
    }
  }
  .menu-list {
    display: none;
    position: absolute;
    top: 60px;
    left: 0;
    /* @media (max-width: 1100px) {
      top: 48px;
      left: -60px;
    } */
    background: var(--o-color-bg2);
    cursor: pointer;
    z-index: 999;
    box-shadow: var(--o-shadow-l1);
    min-width: 78px;
    li {
      text-align: center;
      @include text1;
      color: var(--o-color-text1);
      border-bottom: 1px solid var(--o-color-division1);
      padding: 0 var(--o-gap-5);
      white-space: nowrap;
      &:last-child {
        border-bottom: 0 none;
      }

      &:hover {
        background: var(--o-color-brand1);
        color: var(--o-color-text2);
      }
      &.active {
        color: var(--o-color-brand1);
        background: none;
        cursor: default;
      }
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
