<script setup lang="ts">
import { ref, watch } from 'vue';
import { ODialog, OScroller, useMessage, type DialogActionT } from '@opensig/opendesign';
import { deletePushConfg, getRecipients, getSubscribedRecipients, postPushConfg } from '@/api/api-settings';
import type { PagedResponseT } from '@/@types/types-common';
import type { RecipientT, SubscribeRuleT } from '@/@types/type-settings';
import { eventSourceNames } from '@/data/subscribeSettings';
import SettingsRecipientTable from './SettingsRecipientTable.vue';
import { AxiosError } from 'axios';
import AppButton from '@/components/AppButton.vue';

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

const recipients = ref<Partial<RecipientT>[]>([]);
const loading = ref(false);
const defaultCheckboxes = ref<(string | number)[]>([]);

const addIdSet = new Set<number | string>();
const removeIdSet = new Set<number | string>();

watch(
  () => props.show,
  (show) => {
    if (show) {
      getData();
    } else {
      recipients.value = [];
      addIdSet.clear();
      removeIdSet.clear();
    }
  }
);

const getData = async () => {
  loading.value = true;
  let requestPromise: PagedResponseT<RecipientT>;
  try {
    if (props.type === 'remove') {
      requestPromise = await getSubscribedRecipients(props.effectedRows.map((row) => row.id));
    } else {
      requestPromise = await getRecipients(1, 1000);
    }
    const { query_info } = requestPromise;
    for (const recipient of query_info) {
      recipient.id = Number(recipient.id);
    }
    recipients.value = query_info;
    if (props.effectedRows?.length) {
      const ids = props.effectedRows.flatMap((row) => row.recipients?.map((r) => r.id) || []);
      defaultCheckboxes.value = [...new Set(ids)];
    }
  } catch (error: any) {
    if (error.response?.data.error) {
      message.warning(error.response.data.error);
    }
  }
  loading.value = false;
};

// --------------------多选框改变时回调--------------------
const onCheckboxChange = (recipientId: number, checked: boolean) => {
  const rows = props.effectedRows;
  if (!rows) {
    return;
  }
  if (checked) {
    addIdSet.add(recipientId);
    removeIdSet.delete(recipientId);
  } else {
    addIdSet.delete(recipientId);
    removeIdSet.add(recipientId);
  }
};

// --------------------新增接收人--------------------
const isAdding = ref(false);

const handleAddRecipient = () => {
  if (isAdding.value) {
    return;
  }
  isAdding.value = true;
};

// --------------------按钮--------------------
const actions: DialogActionT[] = [
  {
    id: 'cancel',
    color: 'primary',
    variant: 'solid',
    label: '确定',
    size: 'large',
    round: 'pill',
    onClick: async () => {
      const rules = props.effectedRows;
      if (!rules || (!addIdSet.size && !removeIdSet.size)) {
        return;
      }
      const addIds = [...addIdSet];
      const removeIds = [...removeIdSet];
      try {
        await Promise.all(
          rules.map((rule) => {
            return addIds
              .map((recipientId) =>
                postPushConfg({
                  need_inner_message: rule.need_inner_message,
                  need_mail: rule.need_mail,
                  need_message: rule.need_message,
                  need_phone: false,
                  recipient_id: Number(recipientId),
                  subscribe_id: Number(rule.id),
                })
              )
              .concat(
                removeIds.map((recipientId) =>
                  deletePushConfg({
                    recipient_id: Number(recipientId),
                    subscribe_id: Number(rule.id),
                  })
                )
              );
          })
        );
      } catch (error) {
        if (error instanceof AxiosError && error.response?.data.error) {
          message.warning(error.response.data.error);
        }
      }
      emit('update:show', false);
      emit('update');
    },
  },
  {
    id: 'ok',
    label: '取消',
    color: 'primary',
    round: 'pill',
    size: 'large',
    onClick: () => emit('update:show', false),
  },
];
</script>

<template>
  <ODialog :visible="show" @change="emit('update:show', $event)" :unmountOnHide="false" :actions="actions" style="--dlg-min-height: 780px; --dlg-max-height: 780px;">
    <template #header>修改接收人</template>
    <div>
      <p v-if="effectedRows?.length === 1">
        消息类型：{{ eventSourceNames[effectedRows[0].source ?? 0] }}{{ effectedRows[0].mode_name ? '/' + effectedRows[0].mode_name : '' }}
      </p>
      <AppButton @click="handleAddRecipient" style="margin-top: 12px;">新增接收人</AppButton>
    </div>
    <OScroller class="recipient-editor-content" show-type="hover">
      <div>
        <SettingsRecipientTable
          :data="recipients"
          :loading="loading"
          v-model:adding="isAdding"
          :showCheckbox="true"
          @checkboxChange="onCheckboxChange"
          :defaultCheckboxes="defaultCheckboxes"
          @updateData="getData"
        ></SettingsRecipientTable>
      </div>
    </OScroller>
  </ODialog>
</template>

<style scoped lang="scss">
:deep(.o-pagination-wrap) {
  justify-content: end;
}

.recipient-editor-content {
  min-width: 866px;
  height: 80%;

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
