<script setup lang="ts">
import { ODialog, OForm, OFormItem, OInput, ORadio, type DialogActionT } from '@opensig/opendesign';
import SettingsTagsEditor from './SettingsTagsEditor.vue';
import { reactive, ref } from 'vue';
import { postSubsCondition, putSubsCondition } from '@/api/config';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'confirm'): void;
}>();
const props = defineProps<{
  show: boolean;
  type: 'edit' | 'add';
  eventType: 'push' | 'pr' | 'issue' | 'note';
}>();

const source = 'https://gitee.com';
const repoNameEditor = ref();
const data = reactive({
  mode_name: '',
  mode_filter: {
    repo_name: [],
    is_bot: false,
  },
});

const onCancel = () => {
  emit('update:show', false);
  data.mode_name = '';
  data.mode_filter = {
    repo_name: [],
    is_bot: false,
  };
};

const actions: DialogActionT[] = [
  {
    id: 'cancel',
    label: '取消',
    size: 'large',
    round: 'pill',
    onClick: onCancel,
  },
  {
    id: 'ok',
    label: '确定',
    color: 'primary',
    variant: 'solid',
    round: 'pill',
    size: 'large',
    onClick: () => {
      data.mode_filter.repo_name = repoNameEditor.value.getTagValues();
      (props.type === 'add' ? postSubsCondition : putSubsCondition)({
        ...data,
        source,
        event_type: props.eventType,
      }).then(() => {
        emit('confirm');
        onCancel();
      });
    },
  },
];
</script>

<template>
  <ODialog :visible="show" @change="$emit('update:show', $event)" :unmount-on-hide="false" :actions="actions">
    <template #header>新增Gitee消息接收条件</template>
    <div class="dialog-content">
      <p class="dialog-content-title">消息条件命名</p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="条件名称" required>
          <OInput clearable v-model="data.mode_name" style="width: 100%" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">消息条件命名</p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="仓库名称" required>
          <SettingsTagsEditor ref="repoNameEditor" style="width: 100%" placeholder="请输入仓库名称" />
        </OFormItem>
        <OFormItem label="提交人" required>
          <div style="display: flex; gap: 16px">
            <ORadio v-model="data.mode_filter.is_bot" :value="true">机器人</ORadio>
            <ORadio v-model="data.mode_filter.is_bot" :value="false">非机器人</ORadio>
          </div>
        </OFormItem>
      </OForm>
    </div>
  </ODialog>
</template>

<style scoped lang="scss">
.dialog-content {
  width: 600px;

  .dialog-content-title {
    font-size: 16px;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .form {
    width: 100%;
  }
}
</style>
