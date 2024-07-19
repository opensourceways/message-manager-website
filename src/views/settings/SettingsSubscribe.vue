<script setup lang="ts">
import { provide, reactive, ref } from 'vue';
import { getAllSubs, getSubsDetail } from '@/api/config';
import SettingsSubsTable from './components/SettingsSubsTable.vue';
import SettingsGiteeRuleDialog from './components/SettingsGiteeRuleDialog.vue';
import { EVENT_SOURCES } from '@/data/subscribeSettings';
import type { GiteeModeFilterT, SubscribeRuleT } from '@/@types/type-config';
import SettingsRecipientDialog from './components/SettingsRecipientDialog.vue';

const events: Record<string, Record<string, SubscribeRuleT[]>> = {
  [EVENT_SOURCES.EUR]: {
    build: [],
  },
  [EVENT_SOURCES.GITEE]: {
    issue: [],
    pr: [],
    push: [],
    note: [],
  },
};

const tableRefs = ref<InstanceType<typeof SettingsSubsTable>[]>();

// ------------------------编辑消息接收规则的弹窗里的数据------------------------
const dialogData = reactive({
  show: false,
  dlgType: 'add' as 'add' | 'edit',
  eventType: '',
  subscribe: null as SubscribeRuleT | null,
});

// ------------------------弹窗显示控制------------------------
const dialogSwitches = reactive({
  [EVENT_SOURCES.GITEE]: false, // 新增/编Eur精细化订阅弹窗
  [EVENT_SOURCES.EUR]: false, // 新增/编辑Gitee精细化订阅弹窗
  recipient: false, // 新增/修改接收人弹窗
});

// 子组件点击新增/修改消息接收规则的按钮触发
provide('onEditOrAdd', (dlgType: 'edit' | 'add', source: string, eventType: string, subscribe?: SubscribeRuleT) => {
  dialogData.dlgType = dlgType;
  dialogData.eventType = eventType;
  if (subscribe) {
    dialogData.subscribe = subscribe;
  }
  dialogSwitches[source] = true;
});

// 初始表格数据
const initialData = reactive(events);

/**
 * 聚合detail数据，主要是后端返回的数据中，如果一条消息接收规则有多个接收人，
 *
 * 则返回的形式是有多个id及其他字段相同，除了接收人id和姓名不同的消息接收规则，所以需要聚合成一个
 */
const aggregateData = (data: SubscribeRuleT[]): SubscribeRuleT[] => {
  const map = new Map<string, SubscribeRuleT>();
  for (const item of data) {
    let cached = map.get(item.id);
    if (!cached) {
      cached = item;
      cached.recipients = [{ id: item.recipient_id, name: item.recipient_name }];
      map.set(item.id, cached);
    } else {
      cached.recipients?.push({ id: item.recipient_id, name: item.recipient_name });
    }
  }
  return Array.from(map.values());
};

// 重置表格数据
const resetData = () => {
  for (const prop in initialData) {
    for (const innerProp in initialData[prop]) {
      initialData[prop][innerProp].splice(1, initialData[prop][innerProp].length - 1);
    }
  }
};

// ------------------------获取数据------------------------
const getData = async () => {
  const allSubsData = await getAllSubs();
  resetData();
  for (const item of allSubsData) {
    if (!item.source || !item.event_type) {
      continue;
    }
    if (!item.mode_name) {
      // 如果没有mode_name，则是默认全部消息的精细化订阅，插入首位
      initialData[item.source][item.event_type].unshift(item);
      continue;
    }
    initialData[item.source][item.event_type].push(item);
  }
  const detailData = await getSubsDetail();
  const aggregated = aggregateData(detailData);
  for (const item of aggregated) {
    if (!item.source || !item.event_type) {
      continue;
    }
    const row = initialData[item.source][item.event_type].find((sub) => sub.id === item.id);
    if (row) {
      row.needCheckboxes ??= [];
      row.displayRecipientNames = item.recipients?.map((r) => r.name).join('、');
      row.recipients = item.recipients;
      if (item.need_inner_message) {
        row.needCheckboxes?.push('need_inner_message');
      }
      if (item.need_mail) {
        row.needCheckboxes?.push('need_mail');
      }
      if (item.need_message) {
        row.needCheckboxes?.push('need_message');
      }
    }
  }
};
getData();

// ------------------------修改接收人相关------------------------
const editRecipientsEffectedRows = ref<SubscribeRuleT[]>([]);
const recipientDlgType = ref('add' as 'add' | 'remove');

/**
 * 单个接收规则修改接收人
 * @param rule 订阅规则
 */
const editRecipients = (rule: SubscribeRuleT) => {
  editRecipientsEffectedRows.value = [rule];
  dialogSwitches.recipient = true;
};

/**
 * 父组件点击添加接收人的按钮
 *
 * 查询所有接收人，打开接收人弹窗，勾选操作
 */
const addRecipient = () => {
  if (!tableRefs.value) {
    return;
  }
  editRecipientsEffectedRows.value = tableRefs.value.flatMap((table) => table.getCheckedRules());
  console.log('1', editRecipientsEffectedRows.value);

  recipientDlgType.value = 'add';
  dialogSwitches.recipient = true;
};

const removeRecipient = () => {
  if (!tableRefs.value) {
    return;
  }
  editRecipientsEffectedRows.value = tableRefs.value.map((table) => table.getCheckedRules()).flat();
  recipientDlgType.value = 'remove';
  dialogSwitches.recipient = true;
};

/**
 * 父组件两个按钮是否置灰
 */
const btnDisabled = ref(true);

/**
 * 表格组件上checkbox的改变
 */
const checkboxChange = () => {
  if (!tableRefs.value) {
    return;
  }
  for (const table of tableRefs.value) {
    const count = table.getCheckedRulesCount();
    if (count > 0) {
      btnDisabled.value = false;
      return;
    }
  }
  btnDisabled.value = true;
};

defineExpose({
  btnDisabled,
  addRecipient,
  removeRecipient,
});
</script>

<template>
  <SettingsGiteeRuleDialog
    v-model:show="dialogSwitches[EVENT_SOURCES.GITEE]"
    :type="dialogData.dlgType"
    :eventType="dialogData.eventType"
    :subscribe="(dialogData.subscribe as SubscribeRuleT<GiteeModeFilterT>)"
  />

  <SettingsRecipientDialog v-model:show="dialogSwitches.recipient" :effectedRows="editRecipientsEffectedRows" :type="recipientDlgType" />

  <SettingsSubsTable
    ref="tableRefs"
    v-for="(types, prop) in initialData"
    :key="prop"
    :source="prop"
    :eventTypes="types"
    style="margin-top: 24px; margin-bottom: 24px"
    @editRecipients="editRecipients"
    @checkboxChange="checkboxChange"
  />
</template>
