<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ODivider, OSwitch, useMessage } from '@opensig/opendesign';

import { EventSources } from '@/data/event';
import type { FilterRuleT } from '@/@types/type-settings';
import { deleteFilterRule, getFilterRules } from '@/api/api-settings';
import { saveRule } from '@/api/messages';

import IconClear from '~icons/app/icon-clear.svg';
import IconAdd from '~icons/app/icon-add.svg';
import IconLink from '@/components/IconLink.vue';

import RadioToggle from '@/components/RadioToggle.vue';
import EurFilter from './filters/EurFilter.vue';
import GiteeFilter from './filters/GiteeFilter.vue';
import CveFilter from './filters/CveFilter.vue';

const popupContainer = ref();
provide('popupContainer', popupContainer);

const message = useMessage();
const route = useRoute();
const source = computed<string>(() => decodeURIComponent(route.query.source as string));

const emit = defineEmits<{
  (event: 'reset'): void;
  (event: 'applyQuickFiter', val: string): void;
  (event: 'applyFilter', val: Record<string, any>): void;
}>();

const compMap = {
  [EventSources.EUR]: EurFilter,
  [EventSources.GITEE]: GiteeFilter,
  [EventSources.CVE]: CveFilter,
};
const currentFilterComp = computed(() => compMap[source.value]);
const currentCompRef = ref();
const setCurrenCompRef = (el: any) => (currentCompRef.value = el);

provide('applyFilter', () =>
  emit('applyFilter', {
    source: source.value,
    ...currentCompRef.value?.getFilterParams(),
  })
);

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

onMounted(() => {
  getFilterRules().then((data) => {
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
});

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
const renameFilter = (filterId: string | number, newName: string, resolve: () => void, reject: () => void) => {
  const filters = quickFilterMap.value.get(source.value);
  if (filters) {
    (filters.find((fil) => fil.id === filterId) as FilterRuleT).mode_name = newName;
  }
  // _TODO rename
  resolve();
};

// ----------------重置----------------
const onReset = (allowEmit = true) => {
  selectedQuickFilter.value = '';
  currentCompRef.value?.reset();
  if (allowEmit) {
    emit('reset');
  }
};

const emailSwitch = ref(false);
const weChatSwitch = ref(false);

const saveRuleFlag = ref(false);
const confirmSave = (id: string) => {
  const mode_name = currentFilters.value?.find((filter) => filter.id === id)?.mode_name;
  saveRule({
    spec_version: '1.0',
    mode_name,
    source: source.value,
    ...currentCompRef.value?.getFilterParams(),
  }).then(() => message.success({ content: '保存成功' }));
};

const applyQuickFilter = (id: string) => {
  emit('applyQuickFiter', currentFilters.value?.find((filter) => filter.id === id)?.mode_name as string);
};

const reset = () => onReset(false);

defineExpose({ reset });
</script>

<template>
  <div ref="popupContainer" class="pop-container">
    <template v-if="quickFilterMap.size && source === EventSources.GITEE">
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
      <OSwitch v-model="emailSwitch"></OSwitch>
      <p>微信通知</p>
      <OSwitch v-model="weChatSwitch"></OSwitch>
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
