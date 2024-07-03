import { createRouter, createWebHistory } from 'vue-router';

import { scrollToTop } from '@/utils/common';

import i18n from '@/i18n';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => {
      return import('@/views/message/TheMessages.vue');
    },
  },
  {
    path: '/config',
    name: 'config',
    component: () => {
      return import('@/views/config/TheConfig.vue');
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

router.beforeEach(async (to) => {
  return true;
});

router.afterEach(() => {});

export default router;
