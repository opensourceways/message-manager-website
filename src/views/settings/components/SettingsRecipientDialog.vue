<script setup lang="ts">
import { ref, watch } from 'vue';
import { OButton, ODialog, OPagination, OScroller, useMessage, type DialogActionT } from '@opensig/opendesign';
import { deletePushConfg, getRecipients, getSubscribedRecipients, postPushConfg } from '@/api/api-settings';
import type { PagedResponseT } from '@/@types/types-common';
import type { RecipientT, SubscribeRuleT } from '@/@types/type-settings';
import { eventSourceNames } from '@/data/subscribeSettings';
import {} from '@/composables/useCheckbox';
import SettingsRecipientTable from './SettingsRecipientTable.vue';
import { AxiosError } from 'axios';

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
const pageSizes = [10, 20, 30, 50];
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const defaultCheckboxes = ref<(string | number)[]>([]);

const addSet = new Set<number | string>();
const removeSet = new Set<number | string>();

watch(
  () => props.show,
  (show) => {
    if (show) {
      getData();
    } else {
      recipients.value = [];
      addSet.clear();
      removeSet.clear();
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
      requestPromise = await getRecipients(page.value, pageSize.value);
    }
    const { count, query_info } = requestPromise;
    total.value = count ?? 0;
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
    addSet.add(recipientId);
    removeSet.delete(recipientId);
  } else {
    addSet.delete(recipientId);
    removeSet.add(recipientId);
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
      if (!rules || (!addSet.size && !removeSet.size)) {
        return;
      }
      const addIds = [...addSet];
      const removeIds = [...removeSet];
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
  <ODialog :visible="show" @change="emit('update:show', $event)" :unmountOnHide="false" :actions="actions">
    <OScroller class="recipient-editor-content">
      <div>
        <p v-if="effectedRows?.length === 1" style="font-size: 16px; font-weight: bold">
          消息类型：{{ eventSourceNames[effectedRows[0].source ?? 0] }}/{{ effectedRows[0].mode_name }}
        </p>
        <p style="width: fit-content">
          <OButton variant="outline" round="pill" color="primary" @click="handleAddRecipient">新增接收人</OButton>
        </p>
        <SettingsRecipientTable
          :data="recipients"
          :loading="loading"
          v-model:adding="isAdding"
          :showCheckbox="true"
          @checkboxChange="onCheckboxChange"
          :defaultCheckboxes="defaultCheckboxes"
          @updateData="getData"
        ></SettingsRecipientTable>

        <OPagination :pageSizes="pageSizes" :pageSize="pageSize" :page="page" :total="total" @change="getData"> </OPagination>
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
