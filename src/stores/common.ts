import { getUnreadCount } from '@/api/api-messages';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { useUserInfoStore } from './user';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const sourceCountMap = reactive(new Map<string, { count: number; displayCount: string }>());
  const userInfoStore = useUserInfoStore();
  const totalCount = computed(() => {
    if (!sourceCountMap.size) {
      return 0;
    }
    return Array.from(sourceCountMap.values()).reduce((count, curr) => (count += curr.count), 0);
  });

  const updateCount = () => {
    getUnreadCount(userInfoStore.giteeLoginName)
      .then((res) => {
        sourceCountMap.clear();
        if (!res?.count) {
          return;
        }
        Object.entries(res.count).forEach(([prop, val]) => {
          const displayCount = val ? (val > 999 ? '999+' : val.toString()) : '';
          sourceCountMap.set(prop, { count: val, displayCount });
        });
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
