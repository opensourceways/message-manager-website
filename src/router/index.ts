import { createRouter, createWebHistory } from 'vue-router';

import { scrollToTop } from '@/utils/common';
import { LOGIN_KEYS, doLogin, getCsrfToken } from '@/shared/login';
import { useUserInfoStore } from '@/stores/user';
import { queryUserInfo } from '@/api/api-user';
import { useUnreadMsgCountStore } from '@/stores/common';
import Cookies from 'js-cookie';

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
  if (!csrfToken) {
    userInfoStore.clearUserInfo();
    // doLogin();
    return true;
  }
  if (!userInfoStore.username || !userInfoStore.photo) {
    try {
      userInfoStore.setUserInfo(await queryUserInfo());
    } catch (error) {
      Cookies.remove(LOGIN_KEYS.CSRF_TOKEN);
      // doLogin();
      return true;
    }
  }
  useUnreadMsgCountStore().updateCount();
  return true;
});

router.afterEach(() => {});

export default router;
