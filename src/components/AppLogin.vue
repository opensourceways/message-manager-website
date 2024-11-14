<script setup lang="ts">
import { ref } from 'vue';
import { OIcon, OIconLoading, OPopup } from '@opensig/opendesign';

import LoginIcon from '~icons/app/icon-login.svg';

import { doLogin, logout } from '@/shared/login';
import { useLoginStore, useUserInfoStore } from '@/stores/user';

const userInfoStore = useUserInfoStore();
const userInfo = ref();
const loginStore = useLoginStore();

const toUserCenter = () => window.open(import.meta.env.VITE_LOGIN_URL);
</script>

<template>
  <template v-if="loginStore.isLogined">
    <div class="user-info" ref="userInfo">
      <img v-if="userInfoStore.photo" :src="userInfoStore.photo" />
      <p class="user-name">{{ userInfoStore.username }}</p>
    </div>
    <OPopup position="bottom" :target="userInfo">
      <ul class="header-user-menu">
        <li @click="toUserCenter">个人中心</li>
        <li @click="logout">退出登录</li>
      </ul>
    </OPopup>
  </template>
  <div v-else-if="loginStore.isLoggingIn" class="o-rotating">
    <OIconLoading />
  </div>
  <OIcon v-else class="login-btn" @click="doLogin"><LoginIcon /></OIcon>
</template>

<style scoped lang="scss">
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  height: calc(100% - 20px);

  .user-name {
    margin-left: 8px;
    white-space: nowr ap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 72px;
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}

.header-user-menu {
  width: fit-content;
  background-color: var(--o-color-fill2);
  box-shadow: var(--o-shadow-2);

  li {
    cursor: pointer;
    padding: 0 16px;
    height: 48px;
    @include tip1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--o-color-control1-light);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: rgb(var(--o-kleinblue-6));
      color: var(--o-color-white);
    }
  }
}

.login-btn {
  font-size: 24px;
  cursor: pointer;
}
</style>
