<script setup lang="ts">
import type { RecipientT } from '@/@types/type-settings';
import { addRecipient as postRecipient, deleteRecipient, editRecipient, getRecipients } from '@/api/config';
import { OInput, OLink, OPagination, OTable, useMessage } from '@opensig/opendesign';
import WarningInput from '@/components/WarningInput.vue';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '@vueuse/core';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const message = useMessage();
const { t } = useI18n();
const tableColumns = [
  { label: t('config.table.recipient_id'), key: 'recipient_id' },
  { label: t('config.table.mail'), key: 'mail' },
  { label: t('config.table.phone'), key: 'phone' },
  { label: t('config.table.remark'), key: 'remark' },
  { label: t('config.table.operation'), key: 'operation' },
];
const tableData = ref<RecipientT[]>([]);
const tableLoading = ref(false);
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const PHONE_PATTERN = /^\+861[3-9]\d{9}$/;
const pageSizes = ref([10, 20, 30, 50]);
const currentPage = ref(1);
const pageSize = ref(pageSizes.value[0]);
const tableTotal = ref(0);

function getData(val = { page: 1, pageSize: 10 }) {
  tableLoading.value = true;
  getRecipients(val.page, val.pageSize)
    .then(({ total, data }) => {
      tableData.value = data;
      tableTotal.value = total;
    })
    .catch(() => {
      tableData.value = [];
      tableTotal.value = 0;
    })
    .finally(() => {
      tableLoading.value = false;
    });
}
getData();

// ----------------新增/修改接收人-------------------
const editingData = reactive({
  id: '' as string | number,
  recipient_id: '',
  mail: '',
  phone: '',
  remark: '',
});

// ----------------新增接收人-------------------
const isAddingRecipient = ref(false);

const addRecipient = () => {
  if (isAddingRecipient.value) {
    return;
  }
  tableData.value.unshift({
    id: '',
    key: '',
    recipient_id: '',
    mail: '',
    phone: '',
    remark: '',
  });
  isAddingRecipient.value = true;
}

const confirmAdd = async () => {
  try {
    await postRecipient(editingData);
  } catch (err: any) {
    if (err?.response?.data?.error) {
      message.warning(err?.response?.data?.error);
    }
    return;
  }
  cancelAddOrEdit();
  getData({ page: currentPage.value, pageSize: pageSize.value });
}

// ----------------修改接收人-------------------
const editingRecipientId = ref<number | string | undefined>();

function handleEditRecipient(recipient: RecipientT) {
  if (!recipient) {
    return;
  }
  editingRecipientId.value = recipient.recipient_id;
  editingData.id = recipient.id;
  editingData.recipient_id = recipient.recipient_id;
  editingData.mail = recipient.mail;
  editingData.phone = recipient.phone;
  editingData.remark = recipient.remark;
}

const nameInput = ref();
const phoneInput = ref();
const mailInput = ref();

const isInputsValid = () => {
  if (nameInput.value.doValidate() && phoneInput.value.doValidate() && mailInput.value.doValidate()) {
    return true;
  }
};

async function confirmEdit() {
  await editRecipient({
    ...editingData,
    phone: editingData.phone,
  });
  cancelAddOrEdit();
  getData({ page: currentPage.value, pageSize: pageSize.value });
}

function confirmEditOrAdd() {
  if (!isInputsValid()) {
    return;
  }
  if (editingRecipientId.value) {
    confirmEdit();
  }
  if (isAddingRecipient.value) {
    confirmAdd();
  }
}

function cancelAddOrEdit() {
  if (isAddingRecipient.value) {
    tableData.value.shift();
    isAddingRecipient.value = false;
  }
  editingRecipientId.value = undefined;
  editingData.recipient_id = '';
  editingData.mail = '';
  editingData.phone = '';
  editingData.remark = '';
}

// ----------------删除接收人-------------------
const {
  isRevealed,
  reveal,
  confirm,
  cancel
} = useConfirmDialog();

const deleteRow = async(recipient_id: string) => {
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteRecipient(recipient_id);
      getData({ page: currentPage.value, pageSize: pageSize.value });
    } catch (error: any) {
      if (error?.response?.data?.error) {
        message.warning(error.response.data.error);
      }
    }
  }
}

defineExpose({
  addRecipient
});
</script>

<template>
  <ConfirmDialog :show="isRevealed" title="删除接收人" content="是否删除该接收人?" @confirm="confirm" @cancel="cancel" />

  <OTable
    :columns="tableColumns"
    :loading="tableLoading"
    :data="tableData"
    class="recipient-table"
  >
    <template #td_recipient_id="{ row }">
      <WarningInput
        ref="nameInput"
        v-if="editingRecipientId === row.recipient_id || row.key === ''"
        :noEmpty="true"
        warningText="请输入姓名"
        v-model="editingData.recipient_id"
        placeholder="请输入姓名"
        style="width: 160px"
      />
      <p class="td-p" v-else>{{ row.recipient_id }}</p>
    </template>
    <template #td_mail="{ row }">
      <WarningInput
        ref="mailInput"
        v-if="editingRecipientId === row.recipient_id || row.key === ''"
        :regExp="EMAIL_PATTERN"
        warningText="请输入正确的邮箱"
        v-model="editingData.mail"
        placeholder="请输入邮箱"
        style="width: 160px"
      />
      <p class="td-p" v-else>{{ row.mail }}</p>
    </template>
    <template #td_phone="{ row }">
      <WarningInput
        ref="phoneInput"
        v-if="editingRecipientId === row.recipient_id || row.key === ''"
        :regExp="PHONE_PATTERN"
        warningText="请输入正确的手机号码"
        v-model="editingData.phone"
        placeholder="请输入手机号码"
        style="width: 180px"
      />
      <p class="td-p" v-else>{{ row.displayPhone }}</p>
    </template>
    <template #td_remark="{ row }">
      <OInput
        v-if="editingRecipientId === row.recipient_id || row.key === ''"
        v-model="editingData.remark"
        placeholder="请输入备注"
        clearable
        style="width: 160px"
      />
      <p class="td-p" v-else>{{ row.remark }}</p>
    </template>
    <template #td_operation="{ row }">
      <div v-if="editingRecipientId === row.recipient_id || row.key === ''" class="table-actions">
        <OLink color="primary" @click="confirmEditOrAdd">保存</OLink>
        <OLink color="primary" @click="cancelAddOrEdit" style="margin-left: 32px">取消</OLink>
      </div>
      <div v-else class="table-actions">
        <OLink color="primary" @click="handleEditRecipient(row as RecipientT)">修改</OLink>
        <OLink color="danger" @click="deleteRow((row as any).key)" style="margin-left: 32px">删除</OLink>
      </div>
    </template>
  </OTable>
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

.td-p {
  word-break: break-all;
  max-width: 160px;
}

.table-actions {
  width: fit-content;
}

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

.recipient-table {
  margin-top: 12px;
  border: 1px solid var(--o-color-control-light);
  border-radius: var(--table-radius);
  --table-head-bg: rgb(var(--o-kleinblue-2));
}
</style>
