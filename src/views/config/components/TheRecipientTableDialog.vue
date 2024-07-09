<script setup lang="ts">
import { ref, watch } from 'vue';
import { OButton, OCheckbox, OInput, OLink, OPagination, OTable, useMessage } from '@opensig/opendesign';
import { addRecipient, deletePushConfg, getRecipients, getSubscribedRecipients, postPushConfg } from '@/api/config';
import TheWarningInput from '@/components/TheWarningInput.vue';
import type { Pagination } from '@/@types/types-common';
import type { Recipient } from '@/@types/type-config';

const emit = defineEmits(['update']);
const props = defineProps<{
  effectedRows: any[];
  isShowingDialog: boolean;
  isInRemoveDialog?: boolean;
  add?: boolean;
}>();
const message = useMessage();
const checkedIds = ref<string[]>([]);
const columns = [
  { label: '姓名', key: 'name' },
  { label: '邮箱', key:'mail' },
  { label: '手机', key: 'phone' },
  { label: '备注', key:'remark' },
];
const recipients = ref<{
  id?: any,
  recipient_id: string;
  mail: string;
  phone: string;
  remark: string;
}[]>([]);
const pageSizes = [10, 20, 30, 50];
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const SOURCE: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR消息',
  'https://gitee.com': 'Gitee消息',
};
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

watch(() => props.isShowingDialog, val => {
  if (val) {
    page.value = 1;
    pageSize.value = 10;
    getData({ page: 1, pageSize: 10 });
  } else {
    recipients.value = [];
  }
});

watch(() => props.effectedRows, val => {
  const ids = val.flatMap(row => row.data.recipient_ids);
  checkedIds.value = [...new Set(ids)];
});

watch(() => props.add, val => {
  if (val) {
    handleAddRecipient();
  }
});

function getData(val: { page: number, pageSize: number }) {
  loading.value = true;
  let requestPromise: Promise<Pagination<Recipient>>;
  if (props.isInRemoveDialog) {
    requestPromise = getSubscribedRecipients(props.effectedRows.map(row => row.id));
  } else {
    requestPromise = getRecipients(val.page, val.pageSize);
  }
  requestPromise
    .then(({ total: total_, data }) => {
      total.value = total_ ?? 0;
      recipients.value = data;
    })
    .catch(error => {
      if (error.response?.data.error) {
        message.warning(error.response.data.error);
      }
    })
    .finally(() => loading.value = false);
}

// --------------------多选框改变时回调--------------------
function onRecipientCheckedChange(recipientId: string, ev: Event) {
  const rows = props.effectedRows;
  if (!rows) {
    return;
  }
  if ((ev.target as HTMLInputElement).checked) {
    Promise.all(rows.map(row => {
      return postPushConfg({
        need_inner_message: row.data.need_inner_message,
        need_mail: row.data.need_mail,
        need_message: row.data.need_message,
        need_phone: false,
        recipient_id: Number(recipientId),
        subscribe_id: Number(row.id),
      });
    }))
      .then(() => emit('update'))
      .catch(error => {
        if (error.response?.data.error) {
          message.warning(error.response.data.error);
        }
      });
  } else {
    Promise.all(rows.map(row => {
      return deletePushConfg({
        recipient_id: Number(recipientId),
        subscribe_id: Number(row.id),
      });
    }))
      .then(() => emit('update'))
      .catch(error => {
        if (error.response?.data.error) {
          message.warning(error.response.data.error);
        }
      });
  }
}

// --------------------新增接收人--------------------
function handleAddRecipient() {
  recipients.value.unshift({
    id: '',
    recipient_id: '',
    mail: '',
    phone: '',
    remark: '',
  });
}

function confirmAddRecipient() {
  if (!recipients.value.length) {
    return;
  }
  const row = {...recipients.value[0]};
  if (row.id) {
    return;
  }
  addRecipient({
    recipient_id: row.recipient_id,
    mail: row.mail,
    phone: row.phone,
    remark: row.remark,
  })
    .then(() => {
      cancelAddRecipient();
      getData({ page: page.value, pageSize: pageSize.value });
    })
    .catch(error => {
      if (error.response.data.error) {
        message.warning(error.response.data.error);
      }
    });
}

function cancelAddRecipient() {
  if (recipients.value.length) {
    recipients.value.shift();
  }
}
</script>

<template>
  <div class="recipient-editor-content">
    <p v-if="effectedRows?.length === 1" style="font-size: 16px; font-weight: bold;">
      消息类型：{{ SOURCE[effectedRows[0].data.source ?? 0] }}/{{ effectedRows[0].name }}
    </p>
    <p style="width: fit-content">
      <OButton variant="outline" round="pill" color="primary" @click="handleAddRecipient">新增接收人</OButton>
    </p>
    <OTable
      :columns="columns"
      :data="recipients"
      :loading="loading"
      style="border: 1px solid rgba(0, 0, 0, 0.1); border-radius: var(--table-radius);"
    >
      <template #td_name="{ row }">
        <TheWarningInput
          v-if="row.id === ''"
          :noEmpty="true"
          v-model="row.recipient_id"
          warningText="请输入姓名"
          placeholder="请输入姓名"
          style="width: 160px"
        />
        <p v-else class="td-p">
          <OCheckbox v-model="checkedIds" :value="row.recipient_id" @change="(val, ev) => onRecipientCheckedChange(row.id, ev)"/>
          <span>{{ row.recipient_id }}</span>
        </p>
      </template>
      <template #td_mail="{ row }">
        <TheWarningInput
          v-if="row.id === ''"
          :regExp="EMAIL_PATTERN"
          v-model="row.mail"
          warningText="请输入正确的邮箱"
          placeholder="请输入邮箱"
          style="width: 160px"
        />
        <p v-else class="td-p">{{ row.mail }}</p>
      </template>
      <template #td_phone="{ row }">
        <TheWarningInput
          v-if="row.id === ''"
          :regExp="PHONE_PATTERN"
          v-model="row.phone"
          warningText="请输入正确的手机号码"
          placeholder="请输入手机号码"
          style="width: 160px"
        />
        <p v-else class="td-p">{{ row.phone }}</p>
      </template>
      <template #td_remark="{ row }">
        <template v-if="row.id === ''">
          <OInput 
            v-model="row.remark" 
            placeholder="请输入备注" 
            clearable 
            style="width: 160px"
          />
          <OLink color="primary" @click="confirmAddRecipient">保存</OLink>
          <OLink color="primary" @click="cancelAddRecipient" style="margin-left: 16px;">取消</OLink>
        </template>
        <p v-else class="td-p">{{ row.remark }}</p>
      </template>
    </OTable>
    <OPagination
      :pageSizes="pageSizes"
      :pageSize="pageSize"
      :page="page"
      :total="total"
      @change="getData">
    </OPagination>
  </div>
</template>

<style scoped>
.recipient-editor-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.td-p {
  word-break: break-all;
  max-width: 160px;
  display: flex;
}
</style>