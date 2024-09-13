import { getAllSigs, getMySigs } from '@/api/messages';
import { useUserInfoStore } from '@/stores/user';
import { computed, ref } from 'vue';

const useSigFilter = () => {
  const selectedSigs = ref<string[]>([]);
  // ----------------sig归属----------------
  const sigBelong = ref<'mySig' | 'otherSig' | '' | undefined>();
  const sigBelongOptions = [
    { label: '我的SIG组', value: 'mySig' },
    { label: '其它SIG组', value: 'otherSig' },
  ];
  const allSigReposMap = ref(new Map<string, string[]>());

  const mySigList = ref<string[]>([]);
  const sigList = computed(() => {
    if (sigBelong.value === 'mySig') {
      return mySigList.value;
    }
    if (sigBelong.value === 'otherSig') {
      const mySigSet = new Set(mySigList.value);
      return Array.from(allSigReposMap.value.keys()).filter((item) => !mySigSet.has(item));
    }
    return Array.from(allSigReposMap.value.keys());
  });

  const getSigs = () => {
    getAllSigs().then((data) => {
      for (const item of data) {
        allSigReposMap.value.set(item.sig_name, item.repos);
      }
    });
    getMySigs(useUserInfoStore().giteeLoginName as string).then((data) => {
      if (data?.length) {
        mySigList.value = data.map((item) => item.sig);
      }
    });
  };

  return {
    sigBelong,
    sigBelongOptions,
    allSigReposMap,
    mySigList,
    sigList,
    getSigs,
    selectedSigs,
  };
};

export default useSigFilter;
