<script setup lang="ts">
import type { RecipientT } from '@/@types/type-settings';
import { deleteRecipient, getRecipients } from '@/api/api-settings';
import { OPagination, useMessage } from '@opensig/opendesign';
import { ref } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsRecipientTable from './components/SettingsRecipientTable.vue';

const message = useMessage();
const tableData = ref<RecipientT[]>([]);
const tableLoading = ref(false);
const pageSizes = ref([10, 20, 30, 50]);
const currentPage = ref(1);
const pageSize = ref(pageSizes.value[0]);
const tableTotal = ref(0);

const getData = () => {
  tableLoading.value = true;
  getRecipients(currentPage.value, pageSize.value)
    .then(({ count, query_info }) => {
      tableData.value = query_info;
      tableTotal.value = count;
    })
    .catch(() => {
      tableData.value = [];
      tableTotal.value = 0;
    })
    .finally(() => {
      tableLoading.value = false;
    });
};
getData();

// ----------------新增接收人-------------------
const isAddingRecipient = ref(false);

const addRecipient = () => {
  if (isAddingRecipient.value) {
    return;
  }
  isAddingRecipient.value = true;
};

// ----------------删除接收人-------------------
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();

const deleteRow = async (recipient_id: string | number) => {
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteRecipient(recipient_id as string);
      getData();
    } catch (error: any) {
      if (error?.response?.data?.error) {
        message.warning(error.response.data.error);
      }
    }
  }
};

defineExpose({
  addRecipient,
});
</script>

<template>
  <ConfirmDialog :show="isRevealed" title="删除接收人" content="是否删除该接收人?" @confirm="confirm" @cancel="cancel" />

  <SettingsRecipientTable
    :data="tableData"
    v-model:adding="isAddingRecipient"
    :loading="tableLoading"
    :showActions="true"
    :enableEdit="true"
    @updateData="getData"
    @deleteRow="deleteRow"
  ></SettingsRecipientTable>
  <OPagination :total="tableTotal" v-model:page="currentPage" :pageSizes="pageSizes" v-model:page-size="pageSize" @change="getData" style="margin-top: 32px" />
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
