import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export const useCheckbox = <T>(datasource: MaybeRefOrGetter<T[]>, cbValueExtractor: (item: T) => string | number) => {
  const checkboxVal = ref<(string | number)[]>([]);
  const indeterminate = ref<boolean>(false);
  const checkAllVal = ref<(string | number)[]>([]);
  const isCheckedAll = computed(() => checkAllVal.value.length > 0);
  const ONE = [1];
  const EMPTY: any[] = [];

  const checkAll = () => {
    indeterminate.value = false;
    checkAllVal.value = ONE;
  };

  const clearCheckboxes = () => {
    indeterminate.value = false;
    checkAllVal.value = EMPTY;
    checkboxVal.value = EMPTY;
  };

  watch(
    () => toValue(datasource),
    (val) => {
      if (val.length === 0) {
        clearCheckboxes();
      }
    }
  );

  watch(
    () => checkAllVal.value.length,
    (length) => {
      const ds = toValue(datasource);
      if (ds.length === 0) {
        return;
      }
      if (length) {
        if (checkboxVal.value.length < ds.length) {
          checkboxVal.value = ds.map(cbValueExtractor);
        }
      } else {
        if (!indeterminate.value && checkboxVal.value.length > 0) {
          checkboxVal.value = EMPTY;
        }
      }
    }
  );

  watch(
    () => checkboxVal.value.length,
    (length) => {
      const ds = toValue(datasource);
      if (ds.length === 0) {
        return;
      }
      const isCheckedAll = checkAllVal.value.length > 0;
      if (length === ds.length) {
        if (!isCheckedAll) {
          checkAllVal.value = ONE;
        }
        indeterminate.value = false;
      } else if (length === 0) {
        if (isCheckedAll) {
          checkAllVal.value = EMPTY;
        }
        indeterminate.value = false;
      } else {
        if (isCheckedAll) {
          checkAllVal.value = EMPTY;
        }
        indeterminate.value = true;
      }
    }
  );

  return {
    checkboxVal,
    indeterminate,
    checkAllVal,
    isCheckedAll,
    clearCheckboxes,
    checkAll,
  };
};