import { getAllSigs, getMySigs } from '@/api/messages';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserInfoStore } from './user';

const useSigStore = defineStore('sigStore', () => {
  const allSigReposMap = ref(new Map<string, string[]>());
  const mySigList = ref<string[]>([]);

  const querySigs = () => {
    getAllSigs().then((data) => {
      for (const item of data) {
        allSigReposMap.value.set(item.sig_name, item.repos.sort((a, b) => a.localeCompare(b)));
      }
    });
  };

  const queryMySigs = () => {
    getMySigs(useUserInfoStore().giteeLoginName as string).then((data) => {
      if (data?.length) {
        mySigList.value = data.map((item) => item.sig);
      }
    });
  };

  return {
    allSigReposMap,
    mySigList,
    querySigs,
    queryMySigs,
  };
});

export default useSigStore;
