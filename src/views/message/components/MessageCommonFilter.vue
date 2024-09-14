<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ODivider, OSwitch, useMessage } from '@opensig/opendesign';

import { EventSources } from '@/data/event';
import type { FilterRuleT } from '@/@types/type-settings';
import { deleteFilterRule, getFilterRules, putFilterRule, updateMailStatus } from '@/api/api-settings';
import { saveRule } from '@/api/messages';

import IconClear from '~icons/app/icon-clear.svg';
import IconAdd from '~icons/app/icon-add.svg';
import IconLink from '@/components/IconLink.vue';

import RadioToggle from '@/components/RadioToggle.vue';
import EurFilter from './filters/EurFilter.vue';
import GiteeFilter from './filters/GiteeFilter.vue';
import CveFilter from './filters/CveFilter.vue';
import MeetingFilter from './filters/MeetingFilter.vue';
import { useUserInfoStore } from '@/stores/user';

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
  console.log('?????', currentCompRef.value?.getFilterParams());
  emit('applyFilter', {
    source: source.value,
    ...currentCompRef.value?.getFilterParams(),
  });
});

// ----------------快捷筛选----------------
/** 选中的快捷筛选 */
const selectedQuickFilter = ref('');

/** key: 事件源 */
const quickFilterMap = ref(new Map<string, FilterRuleT[]>());
const currentFilters = computed(() => quickFilterMap.value.get(source.value));

/** 默认快捷筛选 */
const defaultQuickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => filter.is_default).map((filter) => ({ label: filter.mode_name, value: filter.id }));
});
/** 用户创建筛选 */
const quickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => !filter.is_default).map((filter) => ({ label: filter.mode_name, value: filter.id }));
});

onMounted(() => queryFilterRules());

const queryFilterRules = () => {
  getFilterRules().then((data) => {
    quickFilterMap.value.clear();
    data.forEach((item) => {
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
const deleteFilter = (id: string | number) => {
  const { source, mode_name, event_type } = currentFilters.value?.find((fil) => fil.id === id) as FilterRuleT;
  deleteFilterRule(source, mode_name, event_type)
    .then(() => {
      const filters = quickFilterMap.value.get(source);
      if (filters) {
        filters.splice(
          filters.findIndex((fil) => fil.id === id),
          1
        );
      }
    })
    .catch(() => message.danger({ content: '删除失败' }));
};

// ----------------重命名筛选----------------
const renameFilter = (filterId: string | number, newName: string) => {
  const filter = quickFilterMap.value.get(source.value)?.find((fil) => fil.id === filterId);
  if (filter) {
    putFilterRule({
      source: source.value,
      new_name: newName,
      old_name: filter.mode_name,
    })
      .then(() => (filter.mode_name = newName))
      .catch(() => message.danger({ content: '重命名失败' }));
  }
};

// ----------------重置----------------
const onReset = (allowEmit = true) => {
  selectedQuickFilter.value = '';
  currentCompRef.value?.reset();
  if (allowEmit) {
    emit('reset');
  }
  webFilter.value = null;
};

const emailSwitch = ref(false);
const weChatSwitch = ref(false);

const onEmailChange = (val: string | number | boolean) => {
  const filterId = selectedQuickFilter.value;
  if (val) {
    updateMailStatus(filterId, userInfo.recipientId?.toString() as string);
  } else {
    updateMailStatus(filterId, userInfo.recipientId?.toString() as string, false);
  }
};

const saveRuleFlag = ref(false);
const confirmSave = (mode_name: string) => {
  saveRule({
    spec_version: '1.0',
    mode_name,
    source: source.value,
    ...currentCompRef.value?.getFilterParams(),
  }).then(() => {
    queryFilterRules();
    message.success({ content: '保存成功' });
  });
};

const webFilter = ref<Record<string, any> | null | undefined>();
provide('webFilter', webFilter);

const applyQuickFilter = (id: string) => {
  const filter = currentFilters.value?.find((filter) => filter.id === id);
  emit('applyQuickFilter', filter?.mode_name as string);
  webFilter.value = filter?.web_filter;
};

const reset = () => onReset(false);

defineExpose({ reset });
</script>

<template>
  <div ref="popupContainer" class="pop-container">
    <template v-if="saveRuleFlag || currentFilters?.length">
      <p class="sec-title">快捷筛选</p>
      <RadioToggle
        v-model="selectedQuickFilter"
        v-model:add-new="saveRuleFlag"
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

    <IconLink @click="saveRuleFlag = true" color="rgb(var(--o-kleinblue-6))" style="margin-top: 16px">
      保存为快捷筛选项
      <template #prefix>
        <IconAdd />
      </template>
    </IconLink>
    <ODivider direction="h"></ODivider>
    <p>同步用以下方式通知我</p>
    <div class="switches">
      <p>邮箱通知</p>
      <OSwitch v-model="emailSwitch" @change="onEmailChange" :disabled="!selectedQuickFilter"></OSwitch>
      <p style="color: var(--o-color-control1)">微信通知</p>
      <OSwitch v-model="weChatSwitch" disabled></OSwitch>
    </div>

    <IconLink @click="onReset" iconWidth="18px" icon-size="18px" style="position: absolute; right: 0; top: -6px">
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
