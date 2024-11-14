<script setup lang="ts">
import { OCheckbox, OCheckboxGroup, ODialog, OForm, OFormItem, type DialogActionT } from '@opensig/opendesign';
import { useVModel } from '@vueuse/core';
import { reactive } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', val: boolean): void;
}>();

const dlgVisible = useVModel(props, 'visible', emit);

const dlgAction: DialogActionT[] = [
  {
    id: 'ok',
    label: '保存设置',
    color: 'primary',
    variant: 'solid',
    size: 'large',
    round: 'pill',
    onClick: () => {},
  },
  {
    id: 'cancel',
    label: '取消',
    color: 'primary',
    size: 'large',
    round: 'pill',
    onClick: () => {
      dlgVisible.value = false;
    },
  },
];

const rows = reactive({
  todo: {
    label: '待处理的任务',
    checks: [] as number[],
  },
  meetingTodo: {
    label: '待参加的会议',
    checks: [] as number[],
  },
  mentionedMe: {
    label: '提到我的',
    checks: [] as number[],
  },
  dynamic: {
    label: '动态消息',
    checks: [] as number[],
  },
});
</script>

<template>
  <ODialog :actions="dlgAction" v-model:visible="dlgVisible" size="medium" style="--dlg-radius: 8px">
    <template #header>消息接收设置</template>
    <OForm>
      <OFormItem v-for="(val, key) in rows" :label="val.label" :key="key" style="--form-label-width: 96px; --form-label-main-gap: 96px">
        <OCheckboxGroup v-model="val.checks" style="--checkbox-group-gap: 64px">
          <OCheckbox :value="0">站内消息</OCheckbox>
          <OCheckbox :value="1">邮箱</OCheckbox>
          <OCheckbox :disabled="true" :value="2">微信</OCheckbox>
        </OCheckboxGroup>
      </OFormItem>
    </OForm>
  </ODialog>
</template>
