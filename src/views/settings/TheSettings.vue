<script setup lang="ts">
import { provide, reactive, ref } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import { AxiosError } from 'axios';
import { useMessage } from '@opensig/opendesign';

import { deleteSubsRule, getAllSubs, getSubsDetail } from '@/api/api-settings';
import { EVENT_SOURCES } from '@/data/subscribeSettings';
import type { SubscribeRuleT } from '@/@types/type-settings';

import SettingsRulesTable from './components/SettingsRulesTable.vue';
import SettingsGiteeRuleDialog from './dialogs/SettingsGiteeRuleDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsEurRuleDialog from './dialogs/SettingsEurRuleDialog.vue';
import SettingsBreadcrumbs from './components/SettingsBreadcrumbs.vue';

const events: {
  [eventSource: string]: {
    [eventTypes: string]: SubscribeRuleT[];
  };
} = {
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

const tableRefs = ref<InstanceType<typeof SettingsRulesTable>[]>();

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
      initialData[prop][innerProp] = [];
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
    const rule = initialData[item.source][item.event_type].find((rule) => rule.id === item.id);
    if (rule) {
      rule.needCheckboxes ??= [];
      rule.displayRecipientNames = item.recipients?.map((r) => r.name).join('、');
      rule.recipients = item.recipients;
      if (item.need_inner_message) {
        rule.needCheckboxes?.push('need_inner_message');
      }
      if (item.need_mail) {
        rule.needCheckboxes?.push('need_mail');
      }
      if (item.need_message) {
        rule.needCheckboxes?.push('need_message');
      }
    }
  }
};
getData();

// ------------------------编辑消息接收规则的弹窗里的数据------------------------
const dialogData = reactive({
  dlgType: 'add' as 'add' | 'edit', // dialog类型，新增或编辑
  eventType: '', // eventType
  rule: null as SubscribeRuleT | null, // 精细化订阅对象
});

provide('dialogData', dialogData);

// ------------------------弹窗显示控制------------------------
const dialogSwitches = reactive({
  [EVENT_SOURCES.GITEE]: false, // 新增/编Eur精细化订阅弹窗
  [EVENT_SOURCES.EUR]: false, // 新增/编辑Gitee精细化订阅弹窗
  recipient: false, // 新增/修改接收人弹窗
});

// 子组件点击新增/修改消息接收规则的按钮触发
const onEditOrAdd = (dlgType: 'edit' | 'add', source: string, eventType: string, rule?: SubscribeRuleT) => {
  dialogData.dlgType = dlgType;
  dialogData.eventType = eventType;
  if (rule) {
    dialogData.rule = rule;
  }
  dialogSwitches[source] = true;
};

// ------------------------删除规则------------------------
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const deleteModeName = ref('');

const deleteRule = async (param: Pick<SubscribeRuleT, 'mode_name' | 'source' | 'event_type'>) => {
  const { isCanceled } = await reveal();
  if (isCanceled) {
    return;
  }
  try {
    await deleteSubsRule(param);
    await getData();
  } catch (error) {
    if (error instanceof AxiosError && error?.response?.data?.message) {
      useMessage().warning(error.response.data.message);
    }
  }
};
</script>

<template>
  <div class="page-body">
    <SettingsBreadcrumbs />
    <header>
      消息接收设置
    </header>
    <ConfirmDialog :show="isRevealed" @confirm="confirm" @cancel="cancel" title="删除条件" :content="`是否确定删除${deleteModeName}?`"></ConfirmDialog>

    <SettingsEurRuleDialog
      v-model:show="dialogSwitches[EVENT_SOURCES.EUR]"
      @updateData="getData"
    />
    <SettingsGiteeRuleDialog
      v-model:show="dialogSwitches[EVENT_SOURCES.GITEE]"
      @updateData="getData"
    />

    <SettingsRulesTable
      ref="tableRefs"
      v-for="(types, prop) in initialData"
      :key="prop"
      :source="(prop as string)"
      :eventTypes="types"
      style="margin-top: 24px; margin-bottom: 24px"
      @editOrAddRule="onEditOrAdd"
      @deleteRule="deleteRule"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.o-tab-nav-active) {
  --tab-nav-color-active: rgb(var(--o-kleinblue-6));
}

header {
  margin-top: 26px;
}

.page-body {
  margin-top: 26px;
  min-width: 900px;
  max-width: 1416px;

  @include respond-to('>laptop') {
    width: 1416px;
  }

  @include respond-to('<=laptop') {
    width: 80vw;
  }
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @include h1;
}
</style>
