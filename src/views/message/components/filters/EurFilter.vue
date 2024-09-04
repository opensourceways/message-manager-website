<script setup lang="ts">
import RadioToggle from '@/components/RadioToggle.vue';
import { EUR_BUILD_STATUS } from '@/data/event';
import { useUserInfoStore } from '@/stores/user';
import { OForm, OFormItem, OOption, OSelect } from '@opensig/opendesign';
import { computed, inject, ref, type Ref } from 'vue';

const userInfoStore = useUserInfoStore();

const projRelations = [
  { label: '我的项目', value: 'myProj' },
  { label: '我执行的', value: 'myExec' },
];
const projRelation = ref();
const buildStatus = ref<string[]>();

const popupContainer = inject<Ref<HTMLElement>>('popupContainer');

const reset = () => {
  projRelation.value = '';
  buildStatus.value = [];
};

const getFilterParams = () => {
  const params: Record<string, string> = { event_type: 'build' };
  if (userInfoStore.giteeLoginName) {
    if (projRelation.value === 'myProj') {
      params.build_owner = userInfoStore.giteeLoginName;
    } else if (projRelation.value === 'myExec') {
      params.build_creator = userInfoStore.giteeLoginName;
    }
  }
  buildStatus.value?.length && (params.build_status = buildStatus.value.join());
  return params;
};

defineExpose({
  reset,
  getFilterParams,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="项目关系">
      <RadioToggle v-model="projRelation" :options="projRelations" />
    </OFormItem>
    <OFormItem label="构建状态">
      <OSelect v-model="buildStatus" clearable multiple option-position="bottom" style="width: 100%; --select-radius: 4px" :options-wrapper="popupContainer">
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
