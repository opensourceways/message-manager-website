import { getUnreadCount } from '@/api/messages';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUnreadMsgCountStore = defineStore('unreadMsgCount', () => {
  const count = ref(0);

  const updateCount = () => {
    getUnreadCount()
      .then((res) => (count.value = res))
      .catch(() => {});
  };

  return {
    count,
    updateCount,
  };
});
