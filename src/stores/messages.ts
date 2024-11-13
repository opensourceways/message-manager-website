import type { MessageT } from '@/@types/type-messages';
import { defineStore } from 'pinia';

export default defineStore('messages', {
  state() {
    return {
      messages: [] as MessageT[],
    };
  },
  actions: {
    update: () => {},
  },
});
