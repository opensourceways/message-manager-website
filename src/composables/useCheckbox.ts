import { computed, ref, watch, type Ref } from 'vue';

export const useCheckbox = <T>(datasource: Ref<T[]>, cbValueExtractor: (item: T) => string | number) => {
  const checkboxes = ref<(string | number)[]>([]);
  const indeterminate = ref<boolean>(false);
  const parentCheckbox = ref<(string | number)[]>([]);
  const isCheckedAll = computed(() => parentCheckbox.value.length > 0);

  const checkAll = () => {
    indeterminate.value = false;
    parentCheckbox.value = [1];
  };

  const clearCheckboxes = () => {
    indeterminate.value = false;
    parentCheckbox.value = [];
  };

  watch(datasource, (val) => {
    if (val.length === 0) {
      clearCheckboxes();
    }
  });

  watch(parentCheckbox, (val) => {
    if (datasource.value.length === 0) {
      return;
    }
    if (val.length) {
      if (checkboxes.value.length < datasource.value.length) {
        checkboxes.value = datasource.value.map(cbValueExtractor);
      }
    } else {
      if (!indeterminate.value && checkboxes.value.length > 0) {
        checkboxes.value = [];
      }
    }
  });

  watch(checkboxes, (val) => {
    if (datasource.value.length === 0) {
      return;
    }
    if (val.length === datasource.value.length) {
      if (!isCheckedAll.value) {
        parentCheckbox.value = [1];
      }
      indeterminate.value = false;
    } else if (val.length === 0) {
      if (isCheckedAll.value) {
        parentCheckbox.value = [];
      }
      indeterminate.value = false;
    } else {
      if (isCheckedAll.value) {
        parentCheckbox.value = [];
      }
      indeterminate.value = true;
    }
  });

  return {
    checkboxes,
    indeterminate,
    parentCheckbox,
    isCheckedAll,
    clearCheckboxes,
    checkAll,
  };
};
