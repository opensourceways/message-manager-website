<script setup lang="ts">
import { provide, reactive, ref } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import { AxiosError } from 'axios';
import { useMessage } from '@opensig/opendesign';

import { deleteSubsRule, getAllSubs, getSubsDetail } from '@/api/api-settings';
import { EventSources } from '@/data/event';
import type { SubscribeRuleT } from '@/@types/type-settings';

import SettingsRulesTable from './components/SettingsRulesTable.vue';
import SettingsGiteeRuleDialog from './dialogs/SettingsGiteeRuleDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsEurRuleDialog from './dialogs/SettingsEurRuleDialog.vue';
import SettingsBreadcrumbs from './components/SettingsBreadcrumbs.vue';

const events: {
  [eventSource: string]: SubscribeRuleT[];
} = {
  [EventSources.EUR]: [],
  [EventSources.GITEE]: [],
};

const tableRefs = ref<InstanceType<typeof SettingsRulesTable>[]>();

// 初始表格数据
const initialData = reactive(events);

/**
 * 聚合数据，主要是后端返回的数据中，如果一条设置覆盖多个事件类型，则接口会返回多个名字相同的设置，且各具有不同的event_type，所以要合并成一条
 */
const aggregateData = (data: SubscribeRuleT[]): SubscribeRuleT[] => {
  const map = new Map<string, SubscribeRuleT>();
  for (const item of data) {
    if (!item.source || !item.mode_name) {
      continue;
    }
    const key = item.source + item.mode_name;
    let cached = map.get(key);
    if (!cached) {
      cached = item;
      cached.eventTypes = [item.event_type];
      cached.ids = [item.id];
      map.set(key, cached);
      continue;
    }
    cached.eventTypes?.push(item.event_type);
    cached.ids?.push(item.id);
  }
  return Array.from(map.values());
};

// 重置表格数据
const resetData = () => {
  for (const source in initialData) {
    initialData[source] = [];
  }
};

// ------------------------获取数据------------------------
const getData = async () => {
  const allSubsData = aggregateData(await getAllSubs());
  resetData();
  for (const item of allSubsData) {
    if (!item.mode_name || !item.source || !item.event_type) {
      continue;
    }
    initialData[item.source].push(item);
  }
  const detailData = await getSubsDetail();
  for (const item of detailData) {
    if (!item.source || !item.event_type) {
      continue;
    }
    const rule = initialData[item.source].find((rule) => rule.id === item.id);
    if (rule) {
      rule.recipient_id = item.recipient_id;
      rule.needCheckboxes ??= [];
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
  rule: null as SubscribeRuleT | null, // 精细化订阅对象
});

provide('dialogData', dialogData);

// ------------------------弹窗显示控制------------------------
const dialogSwitches = reactive({
  [EventSources.GITEE]: false, // 新增/编Eur精细化订阅弹窗
  [EventSources.EUR]: false, // 新增/编辑Gitee精细化订阅弹窗
  recipient: false, // 新增/修改接收人弹窗
});

// 子组件点击新增/修改消息接收规则的按钮触发
const onEditOrAdd = (dlgType: 'edit' | 'add', source: string, editId?: string | number) => {
  dialogData.dlgType = dlgType;
  if (dlgType === 'edit' && editId !== undefined) {
    dialogData.rule = initialData[source].find(rule => rule.id === editId) as SubscribeRuleT;
  }
  dialogSwitches[source] = true;
};

// ------------------------删除规则------------------------
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const deleteModeName = ref('');

const deleteRule = async (param: SubscribeRuleT) => {
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
      特别关注设置
    </header>
    <ConfirmDialog :show="isRevealed" @confirm="confirm" @cancel="cancel" title="删除条件" :content="`是否确定删除${deleteModeName}?`"></ConfirmDialog>

    <SettingsEurRuleDialog
      v-model:show="dialogSwitches[EventSources.EUR]"
      @updateData="getData"
    />
    <SettingsGiteeRuleDialog
      v-model:show="dialogSwitches[EventSources.GITEE]"
      @updateData="getData"
    />

    <SettingsRulesTable
      ref="tableRefs"
      v-for="(rules, prop) in initialData"
      :key="prop"
      :rules="rules"
      :source="(prop as string)"
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
