import { createRouter, createWebHistory } from 'vue-router';

import { scrollToTop } from '@/utils/common';
import { LOGIN_STATUS, doLogin, getCsrfToken, tokenFailIndicateLogin } from '@/shared/login';
import { useLoginStore, useUserInfoStore } from '@/stores/user';
import { queryUserInfo } from '@/api/api-user';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => {
      return import('@/views/message/TheMessageList.vue');
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => {
      return import('@/views/settings/TheSettings.vue');
    },
  },
  // 默认路由
  {
    path: '/:path(.*)*',
    name: 'notFound',
    component: () => {
      return import('@/components/ResultNotFound.vue');
    },
    meta: { title: '404' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    scrollToTop(0, false);
  },
});

router.beforeEach(async () => {
  const csrfToken = getCsrfToken();
  const userInfoStore = useUserInfoStore();
  const loginStore = useLoginStore();
  if (!csrfToken) {
    userInfoStore.clearUserInfo();
    loginStore.setLoginStatus(LOGIN_STATUS.NOT);
    return true;
  }
  if (!userInfoStore.username || !userInfoStore.photo) {
    try {
      userInfoStore.setUserInfo(await queryUserInfo());
      loginStore.setLoginStatus(LOGIN_STATUS.DONE);
    } catch (error) {
      loginStore.setLoginStatus(LOGIN_STATUS.FAILED);
      // doLogin();
      return true;
    }
  }
  return true;
});

router.afterEach(() => {});

export default router;
