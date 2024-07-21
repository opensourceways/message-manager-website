<script setup lang="ts">
import { doLogin, getCsrfToken, logout } from '@/shared/login';
import { useUnreadMsgCountStore } from '@/stores/common';
import { useUserInfoStore } from '@/stores/user';
import { OBadge, OIcon, OPopup } from '@opensig/opendesign';
import { ref } from 'vue';
import LoginIcon from '~icons/app/icon-login.svg';

const userInfoStore = useUserInfoStore();
const unreadCountStore = useUnreadMsgCountStore();
const userInfo = ref();
const csrfToken = getCsrfToken();

const toUserCenter = () => (window.location.href = import.meta.env.VITE_LOGIN_URL);

const toMsgCenter = () => window.location.reload();
</script>

<template>
  <template v-if="csrfToken">
    <div class="user-info" ref="userInfo">
      <OBadge color="danger" v-if="unreadCountStore.count > 0" :value="unreadCountStore.count">
        <img v-if="userInfoStore.photo" :src="userInfoStore.photo" />
        {{ userInfoStore.username }}
      </OBadge>
      <template v-else>
        <img v-if="userInfoStore.photo" :src="userInfoStore.photo" />
        {{ userInfoStore.username }}
      </template>
    </div>
    <OPopup position="bottom" :target="userInfo">
      <ul class="header-user-menu">
        <li @click="toUserCenter">个人中心</li>
        <li @click="toMsgCenter">
          <OBadge color="danger" v-if="unreadCountStore.count > 0" :value="unreadCountStore.count"> 消息中心 </OBadge>
          <span v-else>消息中心</span>
        </li>
        <li @click="logout">退出登录</li>
      </ul>
    </OPopup>
  </template>
  <div v-else class="login-btn" @click="doLogin">
    <OIcon><LoginIcon /></OIcon>
  </div>
</template>

<style scoped lang="scss">
.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  height: 100%;

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
}

.header-user-menu {
  width: fit-content;
  background-color: var(--o-color-white);
  box-shadow: var(--o-shadow-3);

  li {
    cursor: pointer;
    padding: 8px 24px;
    @include text1;
    border-bottom: 1px solid var(--o-color-control1-light);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: rgb(var(--o-kleinblue-6));
      color: rgb(var(--o-white));
    }
  }
}

.login-btn {
  cursor: pointer;
}
</style>
