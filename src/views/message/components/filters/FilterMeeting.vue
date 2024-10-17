<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { OForm, OFormItem } from '@opensig/opendesign';

import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import useSigFilter from '@/composables/useSigFilter';
import DatePicker from '@/components/DatePicker.vue';
import { EventSourceTypes, EventSources } from '@/data/event';
import { filterProps, type FilterEmits } from './typs';

const props = defineProps(filterProps);
const emit = defineEmits<FilterEmits>();

const { sigBelong, sigBelongOptions, sigList, selectedSigs } = useSigFilter();

const date = ref<Date>();

const params = computed({
  get() {
    const data: Record<string, any> = { event_type: EventSourceTypes[EventSources.MEETING] };
    if (selectedSigs.value?.length) {
      data.meeting_sig = selectedSigs.value.join();
    }
    if (date.value) {
      data.meeting_start_time = date.value.getTime().toString();
    }
    return data;
  },
  set(val) {
    reset(false);
    if (val.meeting_sig) {
      selectedSigs.value = val.meeting_sig.split(',');
    }
    if (val.meeting_start_time) {
      date.value = new Date(Number(val.meeting_start_time));
    }
  },
});

const applyFilter = () => emit('applyFilter', params.value);

watch(
  () => props.quickFilterDetail,
  (val) => {
    if (val) {
      params.value = val;
    }
  }
);

/**
 * 下拉选择可见性改变
 */
const onSelectVisibilityChange = (val: boolean) => {
  if (!val) {
    applyFilter();
  }
};

const onDateChange = (val?: Date) => {
  if (val) {
    applyFilter();
  }
};

const reset = (shouldApply = true) => {
  if (date.value) {
    date.value = undefined;
  }
  selectedSigs.value = [];
  if (shouldApply) {
    applyFilter();
  }
};

defineExpose({
  params,
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
        :options="sigList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="会议日期">
      <DatePicker @change="onDateChange" style="width: 100%; position: relative" v-model="date" />
    </OFormItem>
  </OForm>
</template>

<style lang="scss" scoped>
:deep(.o-input-wrap.is-readonly) {
  cursor: pointer;
}
</style>
