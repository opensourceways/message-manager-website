import { ref, watchEffect } from "vue";

export function useTable(pageSizes?: number[], onPageChange?: (page?: number, pageSize?: number) => void) {
  const _pageSizes = ref(pageSizes ?? [10, 20, 50]);
  const pageSize = ref(_pageSizes.value[0]);
  const currentPage = ref(1);
  const tableTotal = ref(0);

  if (onPageChange) {
    watchEffect(() => {
      onPageChange(currentPage.value, pageSize.value);
    })
  }

  return {
    pageSizes: _pageSizes,
    pageSize,
    currentPage,
    tableTotal
  }
}