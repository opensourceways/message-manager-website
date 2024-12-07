<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ODivider, OIconFilter, OLink, OPopup, OSwitch, useMessage } from '@opensig/opendesign';

import { EventSources } from '@/data/event';
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
import type { FilterRuleT } from '@/@types/type-filter';
import { uniqueBy } from '@/utils/common';

const popupContainer = ref();
const message = useMessage();
const route = useRoute();
const source = computed<string>(() => decodeURIComponent(route.query.source as string));
const userInfo = useUserInfoStore();
const togglesRef = ref();
const filterPopupWidth = computed(() => (source.value === EventSources.CVE ? '480px' : '450px'));
const filterVisible = ref();

watch(filterVisible, (val) => {
  if (!val) {
    togglesRef.value?.clearAddRenameState();
  }
});

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

const isFilterEmpty = computed(() => {
  if (currentCompRef.value?.params) {
    return Object.entries(currentCompRef.value.params as Record<string, any>).every(([prop, val]) => {
      return (
        (prop === 'event_type' && (source.value !== EventSources.GITEE || !val)) ||
        val === undefined ||
        val === null ||
        Number.isNaN(val) ||
        (Array.isArray(val) && val.length === 0) ||
        !val
      );
    });
  }
  return true;
});

const isFiltering = computed(() => !isFilterEmpty.value || selectedQuickFilter.value);

// ----------------快捷筛选----------------
/** 选中的快捷筛选的mode_name */
const selectedQuickFilter = ref('');

/** key: 事件源 */
const quickFilterMap = ref(new Map<string, Partial<FilterRuleT>[]>());
const currentFilters = computed(() => quickFilterMap.value.get(source.value) || []);

/** 默认快捷筛选 */
const defaultQuickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => filter.is_default).map((filter) => filter.mode_name as string);
});
/** 用户创建筛选 */
const quickFilters = computed(() => {
  return currentFilters.value?.filter((filter) => !filter.is_default).map((filter) => filter.mode_name as string);
});

/** 选中的快捷筛选的detail，用来给高级筛选里回显 */
const webFilter = ref<Record<string, any> | null | undefined>();

onMounted(() => queryFilterRules());

const queryFilterRules = () => {
  getFilterRules().then((data) => {
    quickFilterMap.value.clear();
    const filters = uniqueBy(
      data,
      (item) => item.source + item.mode_name,
      (item, duplicate) => {
        if (item.ids) {
          item.ids.push(duplicate.id);
        } else {
          item.ids = [item.id, duplicate.id];
        }
        return item;
      }
    );
    filters.forEach((item) => {
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
      if (item.value === selectedQuickFilter.value) {
        selectedQuickFilter.value = '';
        emailSwitch.value = false;
        reset();
      }
      const filters = quickFilterMap.value.get(source);
      if (filters) {
        filters.splice(index, 1);
      }
    })
    .catch(() => message.danger({ content: '删除失败' }));
};

// ----------------重命名筛选----------------
const renameFilter = (oldName: string, newName: string) => {
  const filter = currentFilters.value?.find((fil) => fil.mode_name === oldName);
  if (filter) {
    putFilterRule({
      source: source.value,
      new_name: newName,
      old_name: filter.mode_name as string,
    })
      .then(() => {
        selectedQuickFilter.value = newName;
        applyQuickFilter(newName);
        queryFilterRules();
      })
      .catch(() => message.danger({ content: '重命名失败' }));
    filter.mode_name = newName;
  }
};

// ----------------重置----------------
const reset = () => {
  selectedQuickFilter.value = '';
  currentCompRef.value?.reset(!isFilterEmpty.value);
  webFilter.value = null;
};

const emailSwitch = ref(false);
const weChatSwitch = ref(false);

const onEmailChange = (val: string | number | boolean) => {
  const filter = currentFilters.value?.find((item) => item.mode_name === selectedQuickFilter.value) as FilterRuleT;
  const filterIds = filter?.ids?.map((item) => item.toString()) ?? [filter.id.toString()];
  if (val) {
    updateMailStatus(filterIds, userInfo.recipientId?.toString() as string);
  } else {
    updateMailStatus(filterIds, userInfo.recipientId?.toString() as string, false);
  }
};

// ----------------添加新规则----------------
const isAddingTag = ref(false);

const addNewFilter = () => {
  if (togglesRef.value) {
    const radioGroupHeight = togglesRef.value.$el.getBoundingClientRect().height;
    const radioHeight = togglesRef.value.$el.querySelector('.o-toggle').getBoundingClientRect().height;
    if (radioGroupHeight >= radioHeight * 7 + 48) {
      message.warning({
        content: '快捷筛选项已达上限，请删除不常用选项',
      });
      return;
    }
  }
  isAddingTag.value = true;
};

const disableSave = computed(() => isAddingTag.value || isFilterEmpty.value);

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

const applyQuickFilter = (mode_name: string) => {
  emit('applyQuickFilter', mode_name);
  const filter = currentFilters.value?.find((filter) => filter.mode_name === mode_name);
  webFilter.value = filter?.web_filter;
  emailSwitch.value = !!filter?.need_mail;
};

defineExpose({ reset, isFiltering });
</script>

<template>
  <OPopup v-model:visible="filterVisible" trigger="click" position="br" :unmount-on-hide="false">
    <template #target>
      <OLink style="--link-color-hover: var(--o-color-primary1)">
        筛选
        <template #icon><OIconFilter style="font-size: 24px" /></template>
      </OLink>
    </template>
    <div ref="popupContainer" class="pop-container" :style="{ width: filterPopupWidth }">
      <template v-if="isAddingTag || currentFilters?.length">
        <p class="sec-title">快捷筛选</p>
        <RadioToggle
          ref="togglesRef"
          v-model="selectedQuickFilter"
          v-model:is-adding-tag="isAddingTag"
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
      <component
        :is="currentFilterComp"
        :ref="setCurrenCompRef"
        @applyFilter="$emit('applyFilter', $event as Record<string, any>)"
        :quickFilterDetail="webFilter"
        :popupContainer="popupContainer"
      ></component>

      <IconLink :disabled="disableSave" @click="addNewFilter" color="rgb(var(--o-kleinblue-6))" style="margin-top: 16px">
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

      <IconLink @click="reset" iconWidth="18px" icon-size="18px" style="position: absolute; right: 16px; top: 24px">
        重置
        <template #prefix>
          <IconClear />
        </template>
      </IconLink>
    </div>
  </OPopup>
</template>

<style lang="scss" scoped>
.pop-container {
  position: relative;
  padding: 24px 16px;
  border-radius: 4px;
  box-shadow: var(--o-shadow-2);
  background-color: var(--o-color-fill2);

  .sec-title {
    @include text2;

    &:first-of-type {
      margin-bottom: 16px;
    }

    &:not(:first-of-type) {
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
