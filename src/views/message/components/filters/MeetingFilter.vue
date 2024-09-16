<script setup lang="ts">
import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import useSigFilter from '@/composables/useSigFilter';
import { OForm, OFormItem, OIconCalendar, OInput } from '@opensig/opendesign';
import { computed, inject, ref, watch, type Ref } from 'vue';
import { onBeforeMount } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

const { sigBelong, sigBelongOptions, sigList, getSigs, selectedSigs } = useSigFilter();

onBeforeMount(getSigs);

const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter');
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

const datePickerRef = ref();

const onClickInput = () => datePickerRef.value?.handleOpen();

/**
 * 下拉选择可见性改变
 */
const onSelectVisibilityChange = (val: boolean) => {
  if (!val) {
    if (applyFilter) {
      applyFilter();
    }
  }
};

const onSelectClear = () => {
  if (applyFilter) {
    applyFilter();
  }
};

const onSelectRemove = () => {
  if (applyFilter) {
    applyFilter();
  }
};

const date = ref<Date>();
const DATE_PATTERN = /\d{4}-\d{1,2}-\d{1,2}/;
const formattedDate = computed({
  get() {
    if (!date.value) {
      return '';
    }
    const d = date.value;
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },
  set(val) {
    if (val && val.match(DATE_PATTERN)) {
      const [y, m, d] = val.split('-');
      date.value = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00`);
    } else {
      date.value = undefined;
    }
  },
});

watch(date, () => {
  if (applyFilter) {
    applyFilter();
  }
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
  formattedDate.value = '';
  if (date.value) {
    date.value = undefined;
  }
  selectedSigs.value = [];
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
        @clear="onSelectClear"
        @remove="onSelectRemove"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="会议日期">
      <div style="width: 100%; position: relative">
        <OInput
          @click="onClickInput"
          v-model="formattedDate"
          clearable
          style="
            --input-bg-color-disabled: var(--input-bg-color);
            --input-bd-color-disabled: var(--input-bd-color);
            height: 100%;
            width: 100%;
            position: absolute;
            left: 0;
            top: 0;
            z-index: 2;
          "
          round="4px"
        >
          <template #suffix>
            <OIconCalendar />
          </template>
        </OInput>
        <el-config-provider :locale="zhCn">
          <el-date-picker ref="datePickerRef" v-model="date" type="date" placeholder="Pick a day" size="default" style="width: 100%" />
        </el-config-provider>
      </div>
    </OFormItem>
  </OForm>
</template>

<style lang="scss" scoped>
:deep(.o-input-wrap.is-readonly) {
  cursor: pointer;
}
</style>
