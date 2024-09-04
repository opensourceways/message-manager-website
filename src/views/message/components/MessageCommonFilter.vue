<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { ODivider, OSwitch, useMessage } from '@opensig/opendesign';

import { EventSources } from '@/data/event';
import type { FilterRuleT } from '@/@types/type-settings';
import { getFilterRules } from '@/api/api-settings';
import { saveRule } from '@/api/messages';

import IconClear from '~icons/app/icon-clear.svg';
import IconAdd from '~icons/app/icon-add.svg';
import IconLink from '@/components/IconLink.vue';

import RadioToggle from '@/components/RadioToggle.vue';
import EurFilter from './filters/EurFilter.vue';
import GiteeFilter from './filters/GiteeFilter.vue';

const props = defineProps<{
  source: string;
}>();

const emit = defineEmits<{
  (event: 'reset'): void;
  (event: 'quickFiter', val: string): void;
}>();

const message = useMessage();

const compMap = {
  [EventSources.EUR]: EurFilter,
  [EventSources.GITEE]: GiteeFilter,
};
const currentFilterComp = computed(() => compMap[props.source]);
const currentCompRef = ref();

const setCurrenCompRef = (val: any) => {
  currentCompRef.value = val;
};

const popupContainer = ref();
provide('popupContainer', popupContainer);

const selectedQuickFilter = ref('');

const quickFilterMap = ref(new Map<string, FilterRuleT[]>());
const currentFilters = computed(() => quickFilterMap.value.get(props.source));

const defaultQuickFilters = computed(() => {
  return currentFilters.value
    ?.filter((filter) => filter.is_default)
    .map((filter) => ({ label: filter.mode_name, value: filter.id }));
});
const quickFilters = computed(() => {
  return currentFilters.value
    ?.filter((filter) => !filter.is_default)
    .map((filter) => ({ label: filter.mode_name, value: filter.id }));
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
    source: props.source,
    ...currentCompRef.value?.getFilterParams(),
  }).then(() => message.success({ content: '保存成功' }));
};

const applyQuickFilter = (id: string) => {
  emit('quickFiter', currentFilters.value?.find((filter) => filter.id === id)?.mode_name as string);
};

const getFilterParams = (): Record<string, any> => {
  return {
    source: props.source,
    ...currentCompRef.value?.getFilterParams(),
  };
};

const reset = () => onReset(false);

defineExpose({ getFilterParams, reset });
</script>

<template>
  <div ref="popupContainer" class="pop-container">
    <template v-if="quickFilterMap.size">
      <p class="sec-title">快捷筛选</p>
      <RadioToggle
        v-model="selectedQuickFilter"
        v-model:add-new="saveRuleFlag"
        @confirm-add="confirmSave"
        @change="applyQuickFilter"
        :options="quickFilters"
        :defaultOptions="defaultQuickFilters"
        enable-rename-tags
      />
    </template>
    <p class="sec-title">高级筛选</p>
    <component :is="currentFilterComp" :ref="(el) => setCurrenCompRef(el)"></component>

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
