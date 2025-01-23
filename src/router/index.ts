import { createRouter, createWebHistory } from 'vue-router';

import { scrollToTop } from '@/utils/common';
import { doLogin, getCsrfToken, tryLogin } from '@/shared/login';
import { useLoginStore, useUserInfoStore } from '@/stores/user';
import { syncUserInfo } from '@/api/api-user';
import { useUnreadMsgCountStore } from '@/stores/common';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => {
      return import('@/views/message/TheMessageList.vue');
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

router.beforeEach(async (to, from) => {
  const loginStore = useLoginStore();
  const unreadCountStore = useUnreadMsgCountStore();
  if (loginStore.isLogined) {
    if (to.name !== from.name) {
      unreadCountStore.updateCount();
    }
    return true;
  }

  if (!getCsrfToken()) {
    doLogin();
    return false;
  }
  try {
    await tryLogin();
  } catch {
    return { name: 'notFound' };
  }

  if (loginStore.isLogined) {
    const userInfoStore = useUserInfoStore();
    const recipientId = await syncUserInfo(userInfoStore);
    userInfoStore.recipientId = recipientId;
  }
  return true;
});

export default router;
