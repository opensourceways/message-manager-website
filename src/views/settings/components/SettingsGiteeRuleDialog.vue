<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ODialog, OForm, OFormItem, OInput, ORadio, type DialogActionT } from '@opensig/opendesign';
import SettingsTagsEditor from './SettingsTagsEditor.vue';
import { postSubsCondition, putSubsCondition } from '@/api/config';
import type { GiteeModeFilterT, SubscribeRuleT } from '@/@types/type-config';
import { EVENT_SOURCES } from '@/data/subscribeSettings';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'confirm'): void;
}>();
const props = defineProps<{
  show: boolean;
  type: 'edit' | 'add';
  eventType: string;
  subscribe?: SubscribeRuleT<GiteeModeFilterT> | null;
}>();

const source = 'https://gitee.com';
const repoNameEditor = ref();
const data = reactive({
  mode_name: '',
  mode_filter: {
    repo_name: [] as string[],
    is_bot: false,
  },
});

watch(
  () => props.show,
  (show) => {
    if (!show) {
      data.mode_name = '';
      data.mode_filter = {
        repo_name: [],
        is_bot: false,
      };
    }
  }
);

watch(
  () => props.subscribe,
  (subs) => {
    if (subs && subs.source === EVENT_SOURCES.GITEE) {
      data.mode_name = subs.mode_name;
      if (subs.mode_filter) {
        data.mode_filter.repo_name = subs.mode_filter.repo_name;
        data.mode_filter.is_bot = subs.mode_filter.is_bot;
      }
    }
  }
);

const onCancel = () => emit('update:show', false);

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
    <template #header>创建消息接收规则</template>
    <div class="dialog-content">
      <p class="dialog-content-title">消息接收规则命名</p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="规则名称" required>
          <OInput clearable v-model="data.mode_name" style="width: 100%" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">消息接收规则设置</p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="仓库名称" required>
          <div>
            <SettingsTagsEditor
              :tags="subscribe?.mode_filter.repo_name"
              ref="repoNameEditor"
              style="width: 100%"
              placeholder="请输入组织和仓库名称，按照“组织名/仓库名”的格式填写，按回车键结束输入"
            />
            <p class="reponame-tips">若需关注所有仓库，使用“*”代替。示例：“openeuler/gcc”、“openeuler/*”</p>
          </div>
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
.reponame-tips {
  color: var(--o-color-info3);
  font-size: var(--o-font_size-tip2);
  margin-left: 16px;
}

.dialog-content {
  width: 600px;

  .dialog-content-title {
    @include text1;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .form {
    width: 100%;
  }
}
</style>
