import { getUnreadCount } from '@/api/api-messages';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const sourceCountMap = ref(new Map<string, number>());
  const totalCount = computed(() => {
    if (!sourceCountMap.value.size) {
      return 0;
    }
    return Array.from(sourceCountMap.value.values()).reduce((count, curr) => count += curr, 0);
  });

  const updateCount = () => {
    getUnreadCount()
      .then((res) => {
        sourceCountMap.value.clear();
        if (!res) {
          return;
        }
        res.forEach((item) => sourceCountMap.value.set(item.source, item.count));
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
