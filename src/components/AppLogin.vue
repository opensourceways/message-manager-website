<script setup lang="ts">
import { useUserInfoStore } from '@/stores/user';
import { OPopup } from '@opensig/opendesign';
import { ref } from 'vue';

const userInfoStore = useUserInfoStore();
const userInfo = ref();
</script>

<template>
  <div class="user-info" ref="userInfo">
    <img :src="userInfoStore.avatar_id" alt="?" />
    {{ userInfoStore.fullname || 'asdasdasd' }}
  </div>
  <OPopup position="bottom" :target="userInfo">
    <div class="header-user-menu">
      <div class="item">
        个人中心
      </div>
      <div class="item">
        消息中心
      </div>
      <div class="item">
        退出登录
      </div>
    </div>
  </OPopup>
</template>

<style scoped lang="scss">
.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
}

.header-user-menu {
  display: flex;
  flex-direction: column;
  background-color: var(--o-color-white);
  box-shadow: var(--o-shadow-3);

  .item {
    cursor: pointer;
    padding: 8px 24px;
    font-size: 16px;
    border-bottom: 1px solid var(--o-color-control1-light);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>