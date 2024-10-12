import { getUnreadCount } from '@/api/api-messages';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useUserInfoStore } from './user';
import { useRoute } from 'vue-router';
import { EventSources } from '@/data/event';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const sourceCountMap = ref(new Map<string, number>());
  const totalCount = computed(() => {
    if (!sourceCountMap.value.size) {
      return 0;
    }
    return Array.from(sourceCountMap.value.values()).reduce((count, curr) => count += curr, 0);
  });

  const updateCount = () => {
    const userStore = useUserInfoStore();
    getUnreadCount()
      .then((res) => {
        sourceCountMap.value.clear();
        if (!res) {
          return;
        }
        res.forEach((item) => {
          if (item.source === EventSources.GITEE && !userStore.giteeLoginName) {
            return;
          }
          sourceCountMap.value.set(item.source, item.count);
        });
      })
      .catch(() => {
        sourceCountMap.value.clear();
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
