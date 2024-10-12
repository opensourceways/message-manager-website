<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { OBadge, OIcon, OIconLoading, OPopup } from '@opensig/opendesign';

import LoginIcon from '~icons/app/icon-login.svg';

import { doLogin, logout } from '@/shared/login';
import { useUnreadMsgCountStore } from '@/stores/common';
import { useLoginStore, useUserInfoStore } from '@/stores/user';

const router = useRouter();
const userInfoStore = useUserInfoStore();
const unreadCountStore = useUnreadMsgCountStore();
const userInfo = ref();
const loginStore = useLoginStore();

const toUserCenter = () => (window.location.href = import.meta.env.VITE_LOGIN_URL);

const toMsgCenter = () => router.push('/');
</script>

<template>
  <template v-if="true">
    <div class="user-info" ref="userInfo">
      <OBadge color="danger" v-if="unreadCountStore.totalCount > 0" :value="unreadCountStore.totalCount">
        <img :src="userInfoStore.photo" />
      </OBadge>
      <img v-else :src="userInfoStore.photo" />
      <p class="user-name">{{ 'asdasdadasdasd' }}</p>
    </div>
    <OPopup position="bottom" :target="userInfo">
      <ul class="header-user-menu">
        <li @click="toUserCenter">个人中心</li>
        <li @click="toMsgCenter">
          <OBadge color="danger" v-if="unreadCountStore.totalCount > 0" :value="unreadCountStore.totalCount"> 消息中心 </OBadge>
          <span v-else>消息中心</span>
        </li>
        <li @click="logout">退出登录</li>
      </ul>
    </OPopup>
  </template>
  <div v-else-if="loginStore.isLoggingIn" class="o-rotating">
    <OIconLoading />
  </div>
  <div v-else class="login-btn" @click="doLogin">
    <OIcon><LoginIcon /></OIcon>
  </div>
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
    width: 24px;
    height: 24px;
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
  cursor: pointer;
}
</style>
