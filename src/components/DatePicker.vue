<script setup lang="ts">
import { OIconCalendar, OInput } from '@opensig/opendesign';
import { useVModel } from '@vueuse/core';
import dayjs from 'dayjs';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue?: Date
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', val: Date): void;
  (event: 'change', val: Date): void;
}>()

const datePickerRef = ref();

const date = useVModel(props, 'modelValue', emit);
const DATE_PATTERN = /\d{4}-\d{1,2}-\d{1,2}/;

const onClickInput = () => datePickerRef.value?.handleOpen();

const formattedDate = computed({
  get() {
    if (!date.value) {
      return '';
    }
    return dayjs(date.value).format('YYYY-MM-DD');
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

const onDateChange = (date: Date) => emit('change', date);
</script>

<template>
  <div>
    <OInput
      @click="onClickInput"
      v-model="formattedDate"
      placeholder="请选择日期"
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
        <OIconCalendar style="font-size: 24px;"/>
      </template>
    </OInput>
    <el-config-provider :locale="zhCn">
      <el-date-picker @change="onDateChange"  ref="datePickerRef" v-model="date" type="date" placeholder="Pick a day" size="default" style="width: 100%" />
    </el-config-provider>
  </div>
</template>