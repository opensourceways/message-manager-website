import { ref, watch, type Ref } from 'vue';

export const useCheckbox = <T>(
  datasource: Ref<T[]>,
  cbValueExtractor: (item: T) => string | number,
) => {
  const checkboxes = ref<(string | number)[]>([]);
  const indeterminate = ref<boolean>(false);
  const parentCheckbox = ref<(string | number)[]>([]);

  watch(parentCheckbox, val => {
    if (datasource.value.length === 0) {
      return;
    }
    if (val.length) {
      if (checkboxes.value.length < datasource.value.length) {
        checkboxes.value = datasource.value.map(cbValueExtractor);
      }
    } else {
      if (checkboxes.value.length > 0) {
        checkboxes.value = [];
      }
    }
  });

  watch(checkboxes, val => {
    if (datasource.value.length === 0) {
      return;
    }
    const parentCheckboxChecked = parentCheckbox.value.length > 0;
    if (val.length === datasource.value.length) {
      if (!parentCheckboxChecked) {
        parentCheckbox.value = [1];
      }
      indeterminate.value = false;
    } else if (val.length === 0) {
      if (parentCheckboxChecked) {
        parentCheckbox.value = [];
      }
      indeterminate.value = false;
    } else {
      if (parentCheckboxChecked) {
        parentCheckbox.value = [];
      }
      indeterminate.value = true;
    }
  });

  const setCheckAll = () => {
    indeterminate.value = false;
    parentCheckbox.value = [1];
  };

  const clearCheckboxes = () => {
    indeterminate.value = false;
    parentCheckbox.value = [];
  };

  return {
    checkboxes,
    indeterminate,
    parentCheckbox,
    clearCheckboxes,
    setCheckAll,
  };
};
