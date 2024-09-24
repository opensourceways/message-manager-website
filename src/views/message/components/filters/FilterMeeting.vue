<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue';
import { OForm, OFormItem } from '@opensig/opendesign';

import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import useSigFilter from '@/composables/useSigFilter';
import DatePicker from '@/components/DatePicker.vue';

const { sigBelong, sigBelongOptions, sigList, selectedSigs } = useSigFilter();

const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter', () => {});
const webFilter = inject<Ref<Record<string, any> | undefined>>('webFilter', ref());

const syncParams = (val: Record<string, any>) => {
  if (!val || !Object.keys(val).length) {
    return;
  }
  if (val.meeting_sig) {
    selectedSigs.value = val.meeting_sig.split(',');
  }
  if (val.meeting_start_time) {
    date.value = new Date(Number(val.meeting_start_time));
  }
};

watch(webFilter, syncParams);

/**
 * 下拉选择可见性改变
 */
const onSelectVisibilityChange = (val: boolean) => {
  if (!val) {
    applyFilter();
  }
};

const date = ref<Date>();

watch(date, () => {
  applyFilter();
});

const getFilterParams = () => {
  const params: Record<string, any> = {};
  if (selectedSigs.value?.length) {
    params.meeting_sig = selectedSigs.value.join();
  }
  if (date.value) {
    params.meeting_start_time = date.value.getTime().toString();
  }
  return params;
};

const reset = () => {
  if (date.value) {
    date.value = undefined;
  }
  selectedSigs.value = [];
  applyFilter();
};

defineExpose({
  getFilterParams,
  reset,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="SIG归属">
      <RadioToggle v-model="sigBelong" enable-cancel-select :options="sigBelongOptions" />
    </OFormItem>
    <OFormItem label="SIG名称">
      <FilterableSelect
        v-model="selectedSigs"
        filterable
        clearable
        placeholder="请选择SIG组"
        :values="sigList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="会议日期">
      <DatePicker style="width: 100%; position: relative" v-model="date" />
    </OFormItem>
  </OForm>
</template>

<style lang="scss" scoped>
:deep(.o-input-wrap.is-readonly) {
  cursor: pointer;
}
</style>
