import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';

export const useCheckbox = <T>(listData: MaybeRefOrGetter<T[]>, checkboxValMapper: (item: T) => string | number, defaultCheckAllValue: string | number = 1) => {
  const checkboxVal = ref<(string | number)[]>([]);
  const ONE = [defaultCheckAllValue];
  const EMPTY: any[] = [];

  const checkAllVal = computed({
    get() {
      if (!toValue(listData).length) {
        return EMPTY;
      }
      return toValue(listData).length === checkboxVal.value.length ? ONE : EMPTY;
    },
    set(val) {
      val.length ? checkAll() : clearCheckboxes();
    },
  });

  const isCheckedAll = computed(() => checkAllVal.value.length > 0);

  const indeterminate = computed(() => {
    if (!toValue(listData).length) {
      return false;
    }
    const length = checkboxVal.value.length;
    return length > 0 && length < toValue(listData).length;
  });

  const clearCheckboxes = () => (checkboxVal.value = EMPTY);

  const checkAll = () => (checkboxVal.value = toValue(listData).map(checkboxValMapper));

  return {
    checkboxVal,
    indeterminate,
    checkAllVal,
    isCheckedAll,
    clearCheckboxes,
    checkAll,
  };
};
