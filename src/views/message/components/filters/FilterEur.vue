<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue';
import { OForm, OFormItem, OOption, OSelect, type SelectOptionT } from '@opensig/opendesign';
import RadioToggle from '@/components/RadioToggle.vue';
import { EUR_BUILD_STATUS } from '@/data/event';
import { useUserInfoStore } from '@/stores/user';
import { reactive } from 'vue';

const userInfoStore = useUserInfoStore();
const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter', () => {});

const filterParams = reactive({
  projRelation: '',
  buildStatus: [] as number[],
});

const params = computed({
  get() {
    const data: Record<string, string> = { event_type: 'build' };
    if (userInfoStore.username) {
      if (filterParams.projRelation === 'myProj') {
        data.build_owner = userInfoStore.username;
      } else if (filterParams.projRelation === 'myExec') {
        data.build_creator = userInfoStore.username;
      }
    }
    if (filterParams.buildStatus?.length) {
      data.build_status = filterParams.buildStatus.join()
    }
    return data;
  },
  set(val) {
    if (val.build_owner) {
      filterParams.projRelation = 'myProj'
    }
    if (val.build_creator) {
      filterParams.projRelation = 'myExec'
    }
    if (val.build_status) {
      filterParams.buildStatus = val.build_status.split(',').map(Number);
    }
  }
});

const webFilter = inject<Ref<Record<string, any> | undefined>>('webFilter', ref());

watch(webFilter, val => {
  if (val) {
    params.value = val;
  }
});

const projRelations = [
  { label: '我的项目', value: 'myProj' },
  { label: '我执行的', value: 'myExec' },
];

const reset = () => {
  filterParams.projRelation = '';
  filterParams.buildStatus = [];
  applyFilter();
};

const exceededLabel = (vals: SelectOptionT[]) => `${vals.length}个选项被选中`;

defineExpose({
  reset,
  params,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="项目关系">
      <RadioToggle v-model="filterParams.projRelation" :options="projRelations" @change="applyFilter" />
    </OFormItem>
    <OFormItem label="构建状态">
      <OSelect
        v-model="filterParams.buildStatus"
        :fold-label="exceededLabel"
        show-fold-tags
        :max-tag-count="1"
        clearable
        multiple
        option-position="bottom"
        style="width: 100%; --select-radius: 4px"
        :options-wrapper="popupContainer"
        @options-visible-change="applyFilter"
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
