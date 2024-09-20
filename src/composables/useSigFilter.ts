import useSigStore from '@/stores/sigs';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const useSigFilter = () => {
  const selectedSigs = ref<string[]>([]);
  // ----------------sig归属----------------
  const sigBelong = ref<'my_sig' | 'other_sig' | '' | undefined>();
  const sigBelongOptions = [
    { label: '我的SIG组', value: 'my_sig' },
    { label: '其它SIG组', value: 'other_sig' },
  ];

  const sigStore = useSigStore();
  const { allSigReposMap, mySigList } = storeToRefs(sigStore);
  if (!allSigReposMap.value.size) {
    sigStore.querySigs();
  }
  if (!mySigList.value.length) {
    sigStore.queryMySigs();
  }

  const sigList = computed(() => {
    if (sigBelong.value === 'my_sig') {
      return mySigList.value;
    }
    if (sigBelong.value === 'other_sig') {
      const mySigSet = new Set(mySigList.value);
      return Array.from(allSigReposMap.value.keys()).filter((item) => !mySigSet.has(item));
    }
    return Array.from(allSigReposMap.value.keys());
  });

  return {
    sigBelong,
    sigBelongOptions,
    allSigReposMap,
    mySigList,
    sigList,
    selectedSigs,
  };
};

export default useSigFilter;
