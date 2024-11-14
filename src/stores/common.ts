import { getUnreadCountNew } from '@/api/api-messages';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { useUserInfoStore } from './user';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const sourceCountMap = reactive(new Map<string, number>());
  const userInfoStore = useUserInfoStore();
  const totalCount = computed(() => {
    if (!sourceCountMap.size) {
      return 0;
    }
    return Array.from(sourceCountMap.values()).reduce((count, curr) => (count += curr), 0);
  });

  const updateCount = () => {
    if (!userInfoStore.giteeLoginName) {
      return;
    }
    getUnreadCountNew(userInfoStore.giteeLoginName)
      .then((res) => {
        sourceCountMap.clear();
        if (!res?.count) {
          return;
        }
        Object.entries(res.count).forEach(([prop, val]) => sourceCountMap.set(prop, val));
      })
      .catch(() => {
        sourceCountMap.clear();
      });
  };

  return {
    sourceCountMap,
    updateCount,
    totalCount,
  };
});

export const useAppearance = defineStore('appearance', {
  state: () => ({
    theme: 'dark',
  }),
});
