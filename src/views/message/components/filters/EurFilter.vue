<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue';
import { OForm, OFormItem, OOption, OSelect, type SelectOptionT } from '@opensig/opendesign';
import RadioToggle from '@/components/RadioToggle.vue';
import { EUR_BUILD_STATUS } from '@/data/event';
import { useUserInfoStore } from '@/stores/user';

const userInfoStore = useUserInfoStore();
const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter');

const webFilter = inject<Ref<Record<string, any> | undefined>>('webFilter', ref());

const syncParams = (val: Record<string, any>) => {
  if (!val || !Object.keys(val).length) {
    return;
  }
  if (val.build_owner) {
    projRelation.value = 'myProj'
  }
  if (val.build_creator) {
    projRelation.value = 'myExec'
  }
  if (val.build_status) {
    buildStatus.value = val.build_status.split(',').map(Number);
  }
};

watch(webFilter, syncParams);

const projRelations = [
  { label: '我的项目', value: 'myProj' },
  { label: '我执行的', value: 'myExec' },
];
const projRelation = ref();
const buildStatus = ref<string[]>();

const projRelationChange = () => {
  if (applyFilter) {
    applyFilter();
  }
};

const reset = () => {
  projRelation.value = '';
  buildStatus.value = [];
};

const getFilterParams = () => {
  const params: Record<string, string> = { event_type: 'build' };
  if (userInfoStore.username) {
    if (projRelation.value === 'myProj') {
      params.build_owner = userInfoStore.username;
    } else if (projRelation.value === 'myExec') {
      params.build_creator = userInfoStore.username;
    }
  }
  buildStatus.value?.length && (params.build_status = buildStatus.value.join());
  return params;
};

const onOptionsVisibleChange = () => {
  if (applyFilter) {
    applyFilter();
  }
}

const exceededLabel = (vals: SelectOptionT[]) => `${vals.length}个选项被选中`;

defineExpose({
  reset,
  getFilterParams,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="项目关系">
      <RadioToggle v-model="projRelation" :options="projRelations" @change="projRelationChange" />
    </OFormItem>
    <OFormItem label="构建状态">
      <OSelect
        v-model="buildStatus"
        :fold-label="exceededLabel"
        show-fold-tags
        :max-tag-count="1"
        clearable
        multiple
        option-position="bottom"
        style="width: 100%; --select-radius: 4px"
        :options-wrapper="popupContainer"
        @options-visible-change="onOptionsVisibleChange"
      >
        <OOption v-for="item in EUR_BUILD_STATUS" :key="item.value" :value="item.value" :label="item.label">
          {{ item.label }}
        </OOption>
      </OSelect>
    </OFormItem>
  </OForm>
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
}
</style>
