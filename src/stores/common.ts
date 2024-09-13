import { getUnreadCount } from '@/api/messages';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const sourceCountMap = ref(new Map<string, number>());
  const totalCount = computed(() => Array.from(sourceCountMap.value.values()).reduce((count, curr) => count += curr, 0));

  const updateCount = () => {
    getUnreadCount()
      .then((res) => {
        res.forEach((item) => sourceCountMap.value.set(item.source, item.count));
        console.log(sourceCountMap.value);
      })
      .catch(() => {});
  };

  return {
    sourceCountMap,
    updateCount,
    totalCount,
  };
});
