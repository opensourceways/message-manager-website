<script setup lang="ts">
import IconLink from '@/components/IconLink.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import { ODivider, OSwitch, useMessage } from '@opensig/opendesign';
import { computed, onMounted, provide, ref } from 'vue';
import IconClear from '~icons/app/icon-clear.svg';
import IconAdd from '~icons/app/icon-add.svg';
import EurFilter from './filters/EurFilter.vue';
import { EventSources } from '@/data/event';
import type { FilterRuleT } from '@/@types/type-settings';
import { getFilterRules } from '@/api/api-settings';
import { saveRule } from '@/api/messages';

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
};
const currentFilterComp = computed(() => compMap[props.source]);
const currentCompRef = ref();

const setCurrenCompRef = (val: any) => {
  currentCompRef.value = val;
};

const filterContainer = ref();
provide('filterContainer', filterContainer);

const selectedQuickFilter = ref('');

const quickFilterMap = ref(new Map<string, FilterRuleT[]>());
const defaultQuickFilters = computed(() => {
  return quickFilterMap.value
    .get(props.source)
    ?.filter((filter) => filter.is_default)
    .map((filter) => filter.mode_name);
});
const quickFilters = computed(() => {
  return quickFilterMap.value
    .get(props.source)
    ?.filter((filter) => !filter.is_default)
    .map((filter) => filter.mode_name);
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
const confirmSave = (mode_name: string) => {
  saveRule({
    spec_version: '1.0',
    mode_name,
    source: props.source,
    ...currentCompRef.value?.getFilterParams(),
  }).then(() => message.success({ content: '保存成功' }));
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
  <div ref="filterContainer" class="filter-container">
    <template v-if="quickFilterMap.size">
      <p class="sec-title">快捷筛选</p>
      <template v-if="defaultQuickFilters?.length">
        <RadioToggle v-model="selectedQuickFilter" @change="$emit('quickFiter', $event)" :options="defaultQuickFilters" />
        <ODivider direction="v" style="height: 100%"></ODivider>
      </template>
      <RadioToggle
        v-model="selectedQuickFilter"
        v-model:add-new="saveRuleFlag"
        @confirm-add="confirmSave"
        @change="$emit('quickFiter', $event)"
        :options="quickFilters"
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
.filter-container {
  position: relative;

  .sec-title {
    @include text1;

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
