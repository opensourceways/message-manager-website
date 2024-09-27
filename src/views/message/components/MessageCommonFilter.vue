<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ODivider, OSwitch, useMessage } from '@opensig/opendesign';

import { EventSources } from '@/data/event';
import type { FilterRuleT } from '@/@types/type-settings';
import { deleteFilterRule, getFilterRules, putFilterRule, updateMailStatus } from '@/api/api-quick-filters';
import { saveRule } from '@/api/api-messages';

import IconClear from '~icons/app/icon-clear.svg';
import IconAdd from '~icons/app/icon-add.svg';
import IconLink from '@/components/IconLink.vue';

import RadioToggle from '@/components/RadioToggle.vue';
import EurFilter from './filters/FilterEur.vue';
import GiteeFilter from './filters/FilterGitee.vue';
import CveFilter from './filters/FilterCve.vue';
import MeetingFilter from './filters/FilterMeeting.vue';
import { useUserInfoStore } from '@/stores/user';
import { uniqueBy } from '@/utils/common';

const popupContainer = ref();
provide('popupContainer', popupContainer);

const message = useMessage();
const route = useRoute();
const source = computed<string>(() => decodeURIComponent(route.query.source as string));
const userInfo = useUserInfoStore();

const emit = defineEmits<{
  (event: 'reset'): void;
  (event: 'applyQuickFilter', val: string): void;
  (event: 'applyFilter', val: Record<string, any>): void;
}>();

const compMap = {
  [EventSources.EUR]: EurFilter,
  [EventSources.GITEE]: GiteeFilter,
  [EventSources.CVE]: CveFilter,
  [EventSources.MEETING]: MeetingFilter,
};
const currentFilterComp = computed(() => compMap[source.value]);
const currentCompRef = ref();
const setCurrenCompRef = (el: any) => (currentCompRef.value = el);

provide('applyFilter', () => {
  emit('applyFilter', {
    source: source.value,
    ...currentCompRef.value?.params,
  });
});

// ----------------快捷筛选----------------
/** 选中的快捷筛选的mode_name */
const selectedQuickFilter = ref('');

/** key: 事件源 */
const quickFilterMap = ref(new Map<string, Partial<FilterRuleT>[]>());
const currentFilters = computed(() => quickFilterMap.value.get(source.value));

/** 默认快捷筛选 */
const defaultQuickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => filter.is_default).map((filter) => filter.mode_name as string);
});
/** 用户创建筛选 */
const quickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => !filter.is_default).map((filter) => filter.mode_name as string);
});

onMounted(() => queryFilterRules());

const queryFilterRules = () => {
  getFilterRules().then((data) => {
    quickFilterMap.value.clear();
    const aa = uniqueBy(data, item => item.source + item.mode_name);
    aa.forEach((item) => {
      const key = item.source;
      const filters = quickFilterMap.value.get(key);
      if (filters) {
        filters.push(item);
      } else {
        quickFilterMap.value.set(key, [item]);
      }
    });
  });
};

// ----------------删除快捷筛选----------------
const deleteFilter = (item: { label: string; value: string | number }) => {
  const index = currentFilters.value?.findIndex((fil) => fil.mode_name === item.value) as number;
  const { source, mode_name, event_type } = currentFilters.value?.[index] as FilterRuleT;
  deleteFilterRule(source, mode_name, event_type)
    .then(() => {
      const filters = quickFilterMap.value.get(source);
      if (filters) {
        filters.splice(index, 1);
      }
    })
    .catch(() => message.danger({ content: '删除失败' }));
};

// ----------------重命名筛选----------------
const renameFilter = (oldVal: { label: string; value: string | number }, newName: string) => {
  const filter = currentFilters.value?.find((fil) => fil.mode_name === oldVal.label);
  if (filter) {
    filter.mode_name = newName;
    putFilterRule({
      source: source.value,
      new_name: newName,
      old_name: filter.mode_name,
    }).catch(() => message.danger({ content: '重命名失败' }));
  }
};

// ----------------重置----------------
const reset = () => {
  selectedQuickFilter.value = '';
  currentCompRef.value?.reset();
  webFilter.value = null;
};

const emailSwitch = ref(false);
const weChatSwitch = ref(false);

const onEmailChange = (val: string | number | boolean) => {
  const filterId = currentFilters.value?.find((item) => item.mode_name === selectedQuickFilter.value)?.id as number;
  if (val) {
    updateMailStatus(filterId.toString(), userInfo.recipientId?.toString() as string);
  } else {
    updateMailStatus(filterId.toString(), userInfo.recipientId?.toString() as string, false);
  }
};

// ----------------添加新规则----------------
const togglesRef = ref();
const isAddingNewRule = ref(false);

const changeAddState = () => {
  const radioGroupHeight = togglesRef.value.$el.getBoundingClientRect().height
  const radioHeight = togglesRef.value.$el.querySelector('.o-toggle').getBoundingClientRect().height
  if (radioGroupHeight >= radioHeight * 7 + 48) {
    message.warning({
      content: '快捷筛选项已达上限，请删除不常用选项'
    });
    return;
  }
  isAddingNewRule.value = true;
}

const disableSave = computed(() => {
  if (currentCompRef.value?.params) {
    return Object.entries(currentCompRef.value.params as Record<string, any>).every(([prop, val]) => {
      if (prop === 'event_type') {
        return true;
      }
      return val === undefined || val === null || Number.isNaN(val) || (Array.isArray(val) && val.length === 0) || !val;
    });
  }
  return true;
});

/** 新增 */
const confirmSave = (mode_name: string, callback: () => void) => {
  const filterDetail = { ...currentCompRef.value?.params };
  if (currentFilters.value?.find((item) => item.mode_name === mode_name)) {
    message.danger({ content: '名称重复' });
    return;
  }
  if (source.value === EventSources.GITEE && !filterDetail.event_type) {
    filterDetail.event_type = 'pr,issue,note';
  }
  saveRule({
    spec_version: '1.0',
    mode_name,
    source: source.value,
    ...filterDetail,
  })
    .then(queryFilterRules)
    .catch(() => {
      message.danger({ content: '保存失败' });
    });
  callback();
  if (!quickFilterMap.value.has(source.value)) {
    quickFilterMap.value.set(source.value, [{ mode_name, web_filter: filterDetail }]);
  } else {
    quickFilterMap.value.get(source.value)?.push({ mode_name, web_filter: filterDetail });
  }
};

/** 选中的快捷筛选的detail，用来给高级筛选里回显 */
const webFilter = ref<Record<string, any> | null | undefined>();
provide('webFilter', webFilter);

const applyQuickFilter = (mode_name: string) => {
  emit('applyQuickFilter', mode_name);
  const filter = currentFilters.value?.find((filter) => filter.mode_name === mode_name);
  webFilter.value = filter?.web_filter;
  emailSwitch.value = !!filter?.need_mail;
};

defineExpose({ reset });
</script>

<template>
  <div ref="popupContainer" class="pop-container">
    <template v-if="isAddingNewRule || currentFilters?.length">
      <p class="sec-title">快捷筛选</p>
      <RadioToggle
        ref="togglesRef"
        v-model="selectedQuickFilter"
        v-model:add-new="isAddingNewRule"
        @confirm-add="confirmSave"
        @change="applyQuickFilter"
        :options="quickFilters"
        :defaultOptions="defaultQuickFilters"
        enable-rename-tags
        enable-delete-tags
        @remove="deleteFilter"
        @rename="renameFilter"
      />
    </template>
    <p class="sec-title">高级筛选</p>
    <component :is="currentFilterComp" :ref="setCurrenCompRef"></component>

    <IconLink :disabled="disableSave" @click="changeAddState" color="rgb(var(--o-kleinblue-6))" style="margin-top: 16px">
      保存为快捷筛选项
      <template #prefix>
        <IconAdd />
      </template>
    </IconLink>
    <ODivider direction="h"></ODivider>
    <p>同步用以下方式通知我</p>
    <div class="switches">
      <p>邮箱通知</p>
      <OSwitch v-model="emailSwitch" @change="onEmailChange" :disabled="!selectedQuickFilter" style="--switch-bg-color-disabled: var(--o-color-control1-light)"></OSwitch>
      <p style="color: var(--o-color-control1)">微信通知</p>
      <OSwitch v-model="weChatSwitch" disabled style="--switch-bg-color-disabled: var(--o-color-control1-light)"></OSwitch>
    </div>

    <IconLink @click="reset" iconWidth="18px" icon-size="18px" style="position: absolute; right: 0; top: -6px">
      重置
      <template #prefix>
        <IconClear />
      </template>
    </IconLink>
  </div>
</template>

<style lang="scss" scoped>
.pop-container {
  position: relative;

  .sec-title {
    @include text2;

    &:first-child {
      margin-bottom: 16px;
    }

    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  .switches {
    display: flex;
    margin-top: 16px;

    & > *:not(:first-child) {
      margin-left: 16px;
    }
  }
}
</style>
