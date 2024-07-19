<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { OButton, OCheckbox, ODialog, OInput, OLink, OPagination, OScroller, OTable, useMessage } from '@opensig/opendesign';
import { addRecipient, deletePushConfg, getRecipients, getSubscribedRecipients, postPushConfg } from '@/api/config';
import WarningInput from '@/components/WarningInput.vue';
import type { Pagination } from '@/@types/types-common';
import type { RecipientT, SubscribeRuleT } from '@/@types/type-config';
import { eventSourceNames } from '@/data/subscribeSettings';
import { useCheckbox } from '@/composables/useCheckbox';

const emit = defineEmits<{
  (event: 'update'): void;
  (event: 'update:show', val: boolean): void;
}>();
const props = defineProps<{
  effectedRows: SubscribeRuleT[];
  show: boolean;
  type: 'add' | 'remove';
}>();
const message = useMessage();

const columns = reactive([
  { label: '姓名', key: 'recipient_id' },
  { label: '邮箱', key: 'mail' },
  { label: '手机', key: 'phone' },
  { label: '备注', key: 'remark' },
]);
const recipients = ref<Partial<RecipientT>[]>([]);
const pageSizes = [10, 20, 30, 50];
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const {
  checkboxes,
  parentCheckbox,
  indeterminate,
} = useCheckbox(recipients, r => r.id as string);

watch(
  () => props.show,
  (show) => {
    if (show) {
      getData({ page: 1, pageSize: 10 });
    } else {
      recipients.value = [];
    }
  }
);

const getData = async (val: { page: number; pageSize: number }) => {
  loading.value = true;
  let requestPromise: Pagination<RecipientT>;
  try {
    if (props.type === 'remove') {
      requestPromise = await getSubscribedRecipients(props.effectedRows.map((row) => row.id));
    } else {
      requestPromise = await getRecipients(val.page, val.pageSize);
    }
    const { total: total_, data } = requestPromise;
    total.value = total_ ?? 0;
    for (const recipient of data) {
      recipient.id = Number(recipient.id);
    }
    recipients.value = data;
    if (props.effectedRows?.length) {
      const ids = props.effectedRows.flatMap((row) => row.recipients?.map((r) => r.id) || []);
      checkboxes.value = [...new Set(ids)];
    }
  } catch (error: any) {
    if (error.response?.data.error) {
      message.warning(error.response.data.error);
    }
  }
  loading.value = false;
};

// --------------------多选框改变时回调--------------------
const onCheckboxChange = (recipientId: number, ev: Event) => {
  const rows = props.effectedRows;
  if (!rows) {
    return;
  }
  if ((ev.target as HTMLInputElement).checked) {
    Promise.all(
      rows.map((row) => {
        return postPushConfg({
          need_inner_message: row.need_inner_message,
          need_mail: row.need_mail,
          need_message: row.need_message,
          need_phone: false,
          recipient_id: Number(recipientId),
          subscribe_id: Number(row.id),
        });
      })
    )
      .then(() => emit('update'))
      .catch((error) => {
        if (error.response?.data.error) {
          message.warning(error.response.data.error);
        }
      });
  } else {
    Promise.all(
      rows.map((row) => {
        return deletePushConfg({
          recipient_id: Number(recipientId),
          subscribe_id: Number(row.id),
        });
      })
    )
      .then(() => emit('update'))
      .catch((error) => {
        if (error.response?.data.error) {
          message.warning(error.response.data.error);
        }
      });
  }
};

// --------------------新增接收人--------------------
const nameInput = ref();
const mailInput = ref();
const phoneInput = ref();
const isAdding = ref(false);
const OPERATION = { label: '操作', key: 'operation' };
const newEmptyRow = () => {
  return{
    id: '',
    recipient_id: '',
    mail: '',
    phone: '',
    remark: '',
  };
};

watch(isAdding, val => {
  if (val) {
    columns.push(OPERATION);
  } else {
    columns.pop();
  }
})

const isInputsValid = () => {
  if (nameInput.value.doValidate() && phoneInput.value.doValidate() && mailInput.value.doValidate()) {
    return true;
  }
};

const handleAddRecipient = () => {
  if (isAdding.value) {
    return;
  }
  isAdding.value = true;
  recipients.value.unshift(newEmptyRow());
};

const confirmAddRecipient = () => {
  if (!isInputsValid()) {
    return;
  }
  if (!recipients.value.length) {
    return;
  }
  const newRow = recipients.value[0];
  if (newRow.id) {
    return;
  }
  addRecipient({
    recipient_id: newRow.recipient_id,
    mail: newRow.mail,
    phone: newRow.phone,
    remark: newRow.remark,
  })
    .then(() => {
      cancelAddRecipient();
      getData({ page: page.value, pageSize: pageSize.value });
    })
    .catch((error) => {
      if (error.response.data.error) {
        message.warning(error.response.data.error);
      }
    });
};

const cancelAddRecipient = () => {
  isAdding.value = false;
  if (recipients.value.length) {
    recipients.value.shift();
  }
};
</script>

<template>
  <ODialog :visible="show" @change="emit('update:show', $event)" :unmountOnHide="false">
    <OScroller class="recipient-editor-content">
      <div>
        <p v-if="effectedRows?.length === 1" style="font-size: 16px; font-weight: bold">
          消息类型：{{ eventSourceNames[effectedRows[0].source ?? 0] }}/{{ effectedRows[0].mode_name }}
        </p>
        <p style="width: fit-content">
          <OButton variant="outline" round="pill" color="primary" @click="handleAddRecipient">新增接收人</OButton>
        </p>
        <OTable
          :columns="columns"
          :data="recipients"
          :loading="loading"
          style="border: 1px solid var(--o-color-control-light); border-radius: var(--table-radius)"
        >
          <template #th_recipient_id>
            <p class="td-p">
              <OCheckbox v-model="parentCheckbox" :value="1" :indeterminate="indeterminate" />
              姓名
            </p>
          </template>
          <template #td_recipient_id="{ row }">
            <WarningInput
              ref="nameInput"
              v-if="row.id === ''"
              :noEmpty="true"
              v-model="row.recipient_id"
              warningText="请输入姓名"
              placeholder="请输入姓名"
              style="width: 160px"
            />
            <p v-else class="td-p">
              <OCheckbox v-model="checkboxes" :value="row.id" @change="(val, ev) => onCheckboxChange(row.id, ev)" />
              <span>{{ row.recipient_id }}</span>
            </p>
          </template>
          <template #td_mail="{ row }">
            <WarningInput
              ref="mailInput"
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
            <WarningInput
              ref="phoneInput"
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
              <OInput v-model="row.remark" placeholder="请输入备注" clearable style="width: 160px" />
            </template>
            <p v-else class="td-p">{{ row.remark }}</p>
          </template>
          <template #td_operation v-if="isAdding">
            <OLink color="primary" @click="confirmAddRecipient">保存</OLink>
            <OLink color="primary" @click="cancelAddRecipient" style="margin-left: 16px">取消</OLink>
          </template>
        </OTable>
        <OPagination :pageSizes="pageSizes" :pageSize="pageSize" :page="page" :total="total" @change="getData"> </OPagination>
      </div>
    </OScroller>
  </ODialog>
</template>

<style scoped lang="scss">
.recipient-editor-content {
  min-width: 866px;
  height: 716px;

  div {
    gap: 12px;
    display: flex;
    flex-direction: column;
  }
}

.td-p {
  word-break: break-all;
  max-width: 160px;
  display: flex;
}
</style>
