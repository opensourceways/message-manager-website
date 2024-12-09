<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { OPagination } from '@opensig/opendesign';

const props = withDefaults(
  defineProps<{
    topMargin?: string;
    bottomMargin?: string;
    total: number;
    page: number;
    pageSize: number;
    pageSizes?: number[];
  }>(),
  {
    topMargin: '20px',
    bottomMargin: '20px',
    page: 1,
    pageSize: 10,
    pageSizes: () => [10, 20, 30, 50],
  }
);

const emits = defineEmits<{
  (event: 'update:page', id: number): void;
  (event: 'update:pageSize', id: number): void;
  (event: 'change'): void;
}>();

const wrapStyle = computed(() => ({
  marginTop: props.topMargin,
  marginBottom: props.bottomMargin,
}));

const onChange = (val: { page: number; pageSize: number }) => {
  emits('update:page', val.page);
  emits('update:pageSize', val.pageSize);
  nextTick(() => emits('change'));
};
</script>

<template>
  <div class="pagination-wrap" :style="wrapStyle">
    <OPagination class="pagination" :simple="true" :total="10000" :page="page" :pageSize="pageSize" :pageSizes="pageSizes" @change="onChange" show-total />
  </div>
</template>

<style scoped lang="scss">
:deep(.o-pagination-wrap) {
  justify-content: flex-end;
}

.pagination-wrap {
  :deep(.o-select) {
    --select-radius: 4px;
    --select-bd-color-hover: var(--o-color-primary1);
    --select-color-hover: var(--o-color-primary1);
  }

  :deep(.o-input) {
    --input-radius: 4px;
    --input-bd-color-hover: var(--o-color-primary1);
    --input-bd-color-focus: var(--o-color-primary1);
  }

  .pagination {
    --pagination-radius: 4px;
    --pagination-arrow-bd-color-hover: var(--o-color-primary1);
    --pagination-arrow-color-hover: var(--o-color-primary1);
  }
}
</style>
