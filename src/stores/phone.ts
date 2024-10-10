import { defineStore } from 'pinia';

export const usePhoneStore = defineStore('phoneStore', {
  state: () => ({
    isManaging: false,
    checkedAll: false,
    checkedCount: 0,
    isFiltering: false,
  }),
});
