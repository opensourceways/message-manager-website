import { ref, watchEffect } from 'vue';

export const usePage = (onPageChange?: (page: number, pageSize: number) => void, pageSizes?: number[]) => {
  const _pageSizes = ref(pageSizes ?? [10, 20, 30, 50]);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  if (onPageChange) {
    watchEffect(() => onPageChange(page.value, pageSize.value));
  }

  return {
    page,
    pageSize,
    pageSizes: _pageSizes,
    total,
  };
};
