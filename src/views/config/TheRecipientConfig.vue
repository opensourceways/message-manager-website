<script setup lang="ts">
import type { Recipient } from '@/@types/type-config';
import { addRecipient, deleteRecipient, editRecipient, getRecipients } from '@/api/config';
import { OButton, OInput, OLink, OPagination, OTable } from '@opensig/opendesign';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const pageSizes = ref([10, 20, 50]);
const pageSize = ref(pageSizes.value[0]);
const currentPage = ref(1);
const tableTotal = ref(0);
const tableColumns = [
  { label: t('config.table.recipient_id'), key: 'recipient_id' },
  { label: t('config.table.mail'), key: 'mail' },
  { label: t('config.table.phone'), key: 'phone' },
  { label: t('config.table.remark'), key: 'remark' },
  { label: t('config.table.createTime'), key: 'formattedCreateTime' },
  { label: t('config.table.operation'), key: 'operation' },
];
const tableData = ref<Recipient[]>([]);
const tableLoading = ref(false);
let addRecipientGenerator: Generator | undefined;

function getData(page?: number, pageSize?: number) {
  tableLoading.value = true;
  getRecipients(page, pageSize).then(({ total, data }) => {
    tableData.value = data;
    tableTotal.value = total;
    if (addRecipientGenerator) {
      addRecipientGenerator.next();
    }
  }).catch(() => {
    tableData.value = [];
    tableTotal.value = 0;
  }).finally(() => {
    tableLoading.value = false;
    if (addRecipientGenerator) {
      addRecipientGenerator.return(0);
      addRecipientGenerator = undefined;
    }
  });
}

watch(
  [currentPage, pageSize],
  ([page, pageSize]) => getData(page, pageSize),
  { immediate: true }
);

// ----------------新增接收人-------------------
const isAddingRecipient = ref(false);
const newData = reactive({
  recipient_id: '',
  mail: '',
  phone: '',
  remark: ''
});

function handleAddRecipient() {
  addRecipientGenerator = (function* () {
    const lastPage = Math.ceil(tableTotal.value / pageSize.value);
    if (currentPage.value < lastPage) {
      // 跳到最后一页
      currentPage.value = lastPage;
      yield;
    }
    isAddingRecipient.value = true;
  })();
  addRecipientGenerator.next();
}

async function confirmAdd() {
  await addRecipient(newData);
  cancelAdd();
  getData(currentPage.value, pageSize.value);
}

function cancelAdd() {
  isAddingRecipient.value = false;
  newData.recipient_id = '';
  newData.mail = '';
  newData.phone = '';
  newData.remark = '';
}

// ----------------修改接收人-------------------
const editingData = reactive({
  recipient_id: '',
  mail: '',
  phone: '',
  remark: ''
});
const editingIndex = ref<number>();

function handleEditRecipient(index: number) {
  const recipient = tableData.value[index];
  if (!recipient) {
    return;
  }
  editingIndex.value = index;
  editingData.recipient_id = recipient.recipient_id;
  editingData.mail = recipient.mail;
  editingData.phone = recipient.phone;
  editingData.remark = recipient.remark;
}

async function confirmEdit() {
  await editRecipient(editingData);
  cancelEdit();
  getData(currentPage.value, pageSize.value);
}

function cancelEdit() {
  editingIndex.value = -1;
  editingData.recipient_id = '';
  editingData.mail = '';
  editingData.phone = '';
  editingData.remark = '';
}

// ----------------删除接收人-------------------
async function deleteRow(recipient_id: string) {
  await deleteRecipient(recipient_id);
  getData(currentPage.value, pageSize.value);
}
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
    <OButton variant="outline" round="pill" color="primary" @click="handleAddRecipient">新建接收人</OButton>
    <p v-html="$t('config.desc')"></p>
  </div>

  <OTable :columns="tableColumns" :loading="tableLoading" :data="tableData" style="margin-top: 12px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: var(--table-radius)">
    <template #body="{ body }">
      <template v-for="(row, rIdx) in body" :key="row.key || rIdx" >
        <tr v-if="editingIndex === rIdx" :class="{ last: !isAddingRecipient && (rIdx + 1 === tableData.length) }">
          <td><OInput v-model="editingData.recipient_id" placeholder="请输入姓名" clearable style="width: 160px" /></td>
          <td><OInput v-model="editingData.mail" placeholder="请输入邮箱" clearable style="width: 160px" /></td>
          <td><OInput v-model="editingData.phone" placeholder="请输入手机" clearable style="width: 160px" /></td>
          <td><OInput v-model="editingData.remark" placeholder="请输入备注" clearable style="width: 160px" /></td>
          <td></td>
          <td>
            <div class="row space-between" style="margin-right: 16px;">
              <OLink color="primary" @click="confirmEdit">保存</OLink>
              <OLink color="primary" @click="cancelEdit" style="margin-left: 16px;">取消</OLink>
            </div>
          </td>
        </tr>
        <tr v-else :class="{ last: !isAddingRecipient && (rIdx + 1 === tableData.length) }">
          <td v-for="(col, idx) in row.data" :key="col.key || idx" :rowspan="col.rowspan" :colspan="col.colspan" :class="{ last: col.last }">
            <div v-if="col.key === 'operation'" class="row space-between" style="margin-right: 16px;">
              <OLink color="primary" @click="handleEditRecipient(rIdx)">修改接收人</OLink>
              <OLink color="danger" @click="deleteRow(row.key)" style="margin-left: 48px;">删除</OLink>
            </div>
            <span v-else>
              {{ col.value }}
            </span>
          </td>
        </tr>
      </template>
      <tr v-if="isAddingRecipient">
        <td><OInput v-model="newData.recipient_id" placeholder="请输入姓名" clearable style="width: 160px" /></td>
        <td><OInput v-model="newData.mail" placeholder="请输入邮箱" clearable style="width: 160px" /></td>
        <td><OInput v-model="newData.phone" placeholder="请输入手机" clearable style="width: 160px" /></td>
        <td><OInput v-model="newData.remark" placeholder="请输入备注" clearable style="width: 160px" /></td>
        <td></td>
        <td>
          <div class="row space-between" style="margin-right: 16px;">
            <OLink color="primary" @click="confirmAdd">保存</OLink>
            <OLink color="primary" @click="cancelAdd" style="margin-left: 16px;">取消</OLink>
          </div>
        </td>
      </tr>
    </template>
  </OTable>
  <OPagination :total="tableTotal" v-model:page="currentPage" v-model:page-size="pageSize" :page-sizes="pageSizes" style="margin-top: 32px;"/>
</template>

<style scoped lang="scss">
.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

.add-receiver {
  border: 1px solid #002EA7;
  background-color: #FFF;
  color: #002EA7;
  font-size: 16px;
  height: 40px;
  padding: 8px 16px;
  border-radius: 20px;
}
</style>