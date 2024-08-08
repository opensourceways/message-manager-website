<script setup lang="ts">
import { OPENEULER } from '@/data/config';

import openeulerLogo from '@/assets/svg-icons/logo.svg';
import IconLeft from '~icons/app/icon-arrow-left.svg';
import IconFilter from '~icons/app/icon-filter.svg';
import IconMultiSel from '~icons/app/icon-multi-select.svg';
import IconX from '~icons/app/icon-x.svg';

import AppLogin from './AppLogin.vue';
import { OButton, OIcon } from '@opensig/opendesign';
import { storeToRefs } from 'pinia';
import { usePhoneStore } from '@/stores/phone';
import { inject, type Ref } from 'vue';

const isPhone = inject<Ref<boolean>>('isPhone');
const { isManaging, checkedAll, checkedCount, isFiltering } = storeToRefs(usePhoneStore());

const onSelectAll = () => checkedAll.value = !checkedAll.value;
</script>

<template>
  <div class="header-wrap">
    <div class="header-content">
      <div class="header-left">
        <template v-if="!isPhone">
          <div class="logo">
            <a target="_blank" :href="`${OPENEULER}/zh/`" class="community-logo" rel="noopener noreferrer">
              <img :src="openeulerLogo" />
            </a>
          </div>
        </template>
        <template v-else>
          <OButton class="back-btn" variant="text" size="medium">
            <template #icon>
              <IconX @click="isManaging = false" v-if="isManaging" />
              <IconLeft v-else />
            </template>
            <span v-if="isManaging">已选择{{ checkedCount ?? 0 }}项</span>
            <span v-else>消息中心</span>
          </OButton>
        </template>
      </div>
      <div class="header-right">
        <AppLogin v-if="!isPhone" />
        <OIcon v-else-if="!isManaging" class="filter-icon" @click="isFiltering = true"><IconFilter /></OIcon>
        <OIcon v-else :class="['select-icon', checkedAll ? 'active' : '']" @click="onSelectAll">
          <IconMultiSel />
        </OIcon>
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
    max-width: var(--layout-content-max-width);
    padding: 0 var(--layout-header-padding);
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
      height: 28px;
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
      @media (max-width: 1100px) {
        width: 28px;
        height: 28px;
      }
    }
    .opt-name {
      color: var(--o-color-text2);
      margin-left: 8px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 72px;
      line-height: var(--o-line-height-h8);
      @media (max-width: 1100px) {
        display: none;
      }
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
    @media (max-width: 1100px) {
      top: 48px;
      left: -60px;
    }
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
