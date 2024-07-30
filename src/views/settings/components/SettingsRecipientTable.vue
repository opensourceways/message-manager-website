<script setup lang="ts">
import type { RecipientT } from '@/@types/type-settings';
import WarningInput from '@/components/WarningInput.vue';
import { OCheckbox, OInput, OLink, OTable, useMessage } from '@opensig/opendesign';
import { watch } from 'vue';
import { addRecipient, deleteRecipient, editRecipient as putRecipient } from '@/api/api-settings';
import { reactive, ref } from 'vue';
import { AxiosError } from 'axios';
import { useCheckbox } from '@/composables/useCheckbox';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useConfirmDialog } from '@vueuse/core';

type DisplayRecipientT = Partial<RecipientT>;

const props = defineProps<{
  data: DisplayRecipientT[];
  showActions?: boolean;
  enableEdit?: boolean;
  adding?: boolean;
  loading?: boolean;
  showCheckbox?: boolean;
  defaultCheckboxes?: (string | number)[];
}>();

const emits = defineEmits<{
  (event: 'updateData'): void;
  (event: 'checkboxChange', recipientId: number, val: boolean): void;
  (event: 'update:adding', val: boolean): void;
  (event: 'deleteRow', id: number | string): void;
}>();

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

const innerData = ref<DisplayRecipientT[]>([]);
const { checkboxes, parentCheckbox, indeterminate } = useCheckbox(innerData, (r) => r.id as string);
const message = useMessage();
const ACTION_COL = { label: '操作', key: 'actions' };
const columns = reactive(
  props.showActions
    ? [{ label: '姓名', key: 'recipient_id' }, { label: '邮箱', key: 'mail' }, { label: '手机', key: 'phone' }, { label: '备注', key: 'remark' }, ACTION_COL]
    : [
        { label: '姓名', key: 'recipient_id' },
        { label: '邮箱', key: 'mail' },
        { label: '手机', key: 'phone' },
        { label: '备注', key: 'remark' },
      ]
);
const editingData = reactive({
  key: '',
  id: '' as string | number,
  recipient_id: '',
  mail: '',
  phone: '',
  remark: '',
});
const nameInput = ref();
const phoneInput = ref();
const mailInput = ref();

watch(
  () => props.data,
  (val) => {
    innerData.value = val ? [...val] : [];
  }
);

watch(
  () => props.defaultCheckboxes,
  (val) => {
    if (val) {
      checkboxes.value = val;
    }
  }
);

// ------------------------验证数据有效------------------------
const isInputsValid = () => {
  if (nameInput.value.doValidate() && phoneInput.value.doValidate() && mailInput.value.doValidate()) {
    return true;
  }
};

// ------------------------新增接收人------------------------
watch(
  () => props.adding,
  (val) => {
    if (val) {
      innerData.value?.unshift({
        id: '_',
        key: '',
        recipient_id: '',
        mail: '',
        phone: '',
        remark: '',
      });
      if (!props.showActions) {
        columns.push(ACTION_COL);
      }
    }
  }
);

// ------------------------修改接收人------------------------
const editRecipient = (recipient: RecipientT) => {
  if (!recipient) {
    return;
  }
  editingData.id = recipient.id;
  editingData.recipient_id = recipient.recipient_id;
  editingData.mail = recipient.mail;
  editingData.phone = recipient.phone;
  editingData.remark = recipient.remark;
  if (!props.showActions) {
    columns.push(ACTION_COL);
  }
};

// ------------------------确认修改/新增接收人------------------------
const confirm = async () => {
  if (!isInputsValid()) {
    return;
  }
  try {
    if (props.adding) {
      await addRecipient(innerData.value[0]);
    } else {
      await putRecipient(editingData);
    }
  } catch (error) {
    if (error instanceof AxiosError && error?.response?.data?.error) {
      message.warning(error?.response?.data?.error);
    }
  }
  cancel();
  emits('updateData');
};

// ------------------------取消修改/新增接收人------------------------
const cancel = () => {
  if (props.adding) {
    innerData.value.shift();
    emits('update:adding', false);
  } else {
    editingData.id = '';
    editingData.recipient_id = '';
    editingData.mail = '';
    editingData.phone = '';
    editingData.remark = '';
  }
  if (!props.showActions) {
    columns.pop();
  }
};

// ------------------------删除接收人------------------------
const { isRevealed, reveal, confirm: dlgConfirm, cancel: dlgCancel } = useConfirmDialog();

const deleteRow = async (recipient_id: string | number) => {
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteRecipient(recipient_id as string);
      emits('updateData');
    } catch (error: any) {
      if (error?.response?.data?.error) {
        message.warning(error.response.data.error);
      }
    }
  }
};

// ------------------------多选框状态改变------------------------
const checkboxChange = (recipientId: number, ev: Event) => emits('checkboxChange', recipientId, (ev.target as HTMLInputElement).checked);

const phoneNumValidator = (num: string) => {
  if (num.startsWith('+86')) {
    return PHONE_PATTERN.test(num.slice(3));
  }
  return PHONE_PATTERN.test(num);
};
</script>

<template>
  <Teleport to="body">
    <ConfirmDialog :show="isRevealed" title="删除接收人" content="是否删除该接收人?" @confirm="dlgConfirm" @cancel="dlgCancel" />
  </Teleport>

  <OTable :columns="columns" :loading="loading" :data="innerData" class="recipient-table">
    <template #th_recipient_id v-if="showCheckbox">
      <p class="td-p">
        <OCheckbox v-model="parentCheckbox" :value="1" :indeterminate="indeterminate" />
        姓名
      </p>
    </template>
    <template #td_recipient_id="{ row }">
      <!-- 用于编辑 -->
      <WarningInput
        ref="nameInput"
        v-if="editingData.id === row.id"
        :noEmpty="true"
        warningText="请输入姓名"
        v-model="editingData.recipient_id"
        placeholder="请输入姓名"
        style="width: 160px"
      />
      <!-- 用于新增 -->
      <WarningInput
        ref="nameInput"
        v-else-if="row.id === '_'"
        :noEmpty="true"
        warningText="请输入姓名"
        v-model="row.recipient_id"
        placeholder="请输入姓名"
        style="width: 160px"
      />
      <p v-else class="td-p">
        <OCheckbox v-if="showCheckbox" v-model="checkboxes" :value="row.id" @change="(_, ev) => checkboxChange(row.id, ev)" />
        <span>{{ row.recipient_id }}</span>
      </p>
    </template>
    <template #td_mail="{ row }">
      <!-- 用于编辑 -->
      <WarningInput
        ref="mailInput"
        v-if="editingData.id === row.id"
        :regExp="EMAIL_PATTERN"
        warningText="请输入正确的邮箱"
        v-model="editingData.mail"
        placeholder="请输入邮箱"
        style="width: 160px"
      />
      <!-- 用于新增 -->
      <WarningInput
        ref="mailInput"
        v-else-if="row.id === '_'"
        :regExp="EMAIL_PATTERN"
        warningText="请输入正确的邮箱"
        v-model="row.mail"
        placeholder="请输入邮箱"
        style="width: 160px"
      />
      <p class="td-p" v-else>{{ row.mail }}</p>
    </template>
    <template #td_phone="{ row }">
      <!-- 用于编辑 -->
      <WarningInput
        ref="phoneInput"
        v-if="editingData.id === row.id"
        :validator="phoneNumValidator"
        warningText="请输入正确的手机号码"
        v-model="editingData.phone"
        placeholder="请输入手机号码"
        style="width: 180px"
      />
      <!-- 用于新增 -->
      <WarningInput
        ref="phoneInput"
        v-else-if="row.id === '_'"
        :validator="phoneNumValidator"
        warningText="请输入正确的手机号码"
        v-model="row.phone"
        placeholder="请输入手机号码"
        style="width: 180px"
      />
      <p class="td-p" v-else>{{ row.displayPhone }}</p>
    </template>
    <template #td_remark="{ row }">
      <OInput v-if="editingData.id === row.id" v-model="editingData.remark" placeholder="请输入备注" clearable style="width: 160px" />
      <OInput v-else-if="row.id === '_'" v-model="row.remark" placeholder="请输入备注" clearable style="width: 160px" />
      <p class="td-p" v-else>{{ row.remark }}</p>
    </template>
    <template #td_actions="{ row }">
      <div v-if="editingData.id === row.id || row.key === ''" class="table-actions">
        <OLink color="primary" @click="confirm()">保存</OLink>
        <OLink color="primary" @click="cancel()" style="margin-left: 32px">取消</OLink>
      </div>
      <div v-else-if="enableEdit" class="table-actions">
        <OLink color="primary" @click="editRecipient(row as RecipientT)">修改</OLink>
        <OLink color="danger" @click="deleteRow((row as RecipientT).id)" style="margin-left: 32px">删除</OLink>
      </div>
    </template>
  </OTable>
</template>

<style scoped lang="scss">
:deep(td) {
  vertical-align: top;
}

.td-p {
  word-break: break-all;
  display: flex;
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
  border: 1px solid var(--o-color-control4);
  border-radius: var(--table-radius);
  --table-head-bg: rgb(var(--o-kleinblue-2));
  --table-row-hover: rgb(var(--o-kleinblue-1));
  --table-text-size: 14px;
}
</style>
