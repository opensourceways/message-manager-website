<script setup lang="ts">
import { ref } from 'vue';
import { OPagination } from '@opensig/opendesign';
import type { RecipientT } from '@/@types/type-settings';
import { getRecipients } from '@/api/api-settings';
import SettingsRecipientTable from './components/SettingsRecipientTable.vue';
import { usePage } from '@/composables/usePage';

const tableData = ref<RecipientT[]>([]);
const tableLoading = ref(false);

const getData = (page = 1, pageSize = 10) => {
  tableLoading.value = true;
  getRecipients(page, pageSize)
    .then(({ count, query_info }) => {
      tableData.value = query_info;
      total.value = count;
    })
    .catch(() => {
      tableData.value = [];
      total.value = 0;
    })
    .finally(() => {
      tableLoading.value = false;
    });
};
const {
  page,
  pageSize,
  pageSizes,
  total,
} = usePage(getData);

// ----------------新增接收人-------------------
const isAddingRecipient = ref(false);

const addRecipient = () => {
  if (isAddingRecipient.value) {
    return;
  }
  isAddingRecipient.value = true;
};

defineExpose({
  addRecipient,
});
</script>

<template>
  <SettingsRecipientTable
    :data="tableData"
    v-model:adding="isAddingRecipient"
    :loading="tableLoading"
    :showActions="true"
    :enableEdit="true"
    @updateData="getData"
  ></SettingsRecipientTable>
  <OPagination :total="total" v-model:page="page" :pageSizes="pageSizes" v-model:page-size="pageSize" style="margin-top: 32px" />
</template>

<style scoped lang="scss">
.dlg-action {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.delete-recipient-dlg-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: var(--o-font_size-text2);
}

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}
</style>
