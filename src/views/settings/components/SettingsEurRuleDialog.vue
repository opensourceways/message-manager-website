<script setup lang="ts">
import type { EurModeFilterT, SubscribeRuleT } from '@/@types/type-settings';
import { ODialog, OForm, OFormItem, OInput, OOption, OSelect, type DialogActionT } from '@opensig/opendesign';
import { reactive, ref } from 'vue';
import SettingsTagsEditor from './SettingsTagsEditor.vue';
import { EVENT_SOURCES, eurBuildStatus } from '@/data/subscribeSettings';
import { postSubsRule, putSubsRule } from '@/api/api-settings';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'confirm'): void;
}>();

const props = defineProps<{
  show: boolean;
  type: 'edit' | 'add';
  eventType: string;
  subscribe?: SubscribeRuleT<EurModeFilterT> | null;
}>();

const data = reactive<{ mode_name: string; mode_filter: EurModeFilterT }>({
  mode_name: '',
  mode_filter: {
    status: [] as number[],
    source_group: [],
  },
});

const projectNameEditor = ref();

const onCancel = () => emit('update:show', false);
const actions: DialogActionT[] = [
  {
    id: 'ok',
    label: '确定',
    color: 'primary',
    variant: 'solid',
    round: 'pill',
    size: 'large',
    onClick: () => {
      data.mode_filter.source_group = projectNameEditor.value.getTagValues();
      (props.type === 'add' ? postSubsRule : putSubsRule)({
        ...data,
        source: EVENT_SOURCES.EUR,
        event_type: props.eventType,
      }).then(() => {
        emit('confirm');
        onCancel();
      });
    },
  },
  {
    id: 'cancel',
    label: '取消',
    color: 'primary',
    size: 'large',
    round: 'pill',
    onClick: onCancel,
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
        <OFormItem label="项目名称" required>
          <div>
            <SettingsTagsEditor ref="projectNameEditor" style="width: 100%" placeholder="请按照“User/Project”的格式填写关注的项目，按回车键结束输入" />
            <p class="reponame-tips">若需关注所有项目，使用“*”代替。示例：“lihua/testProject”、“lihua/*”</p>
          </div>
        </OFormItem>
        <OFormItem label="构建状态" required>
          <OSelect v-model="data.mode_filter.status" multiple variant="outline" placeholder="请选择构建状态" clearable>
            <OOption v-for="item in eurBuildStatus" :key="item.value" :label="item.label" :value="item.value" />
          </OSelect>
        </OFormItem>
      </OForm>
    </div>
  </ODialog>
</template>

<style scoped lang="scss">
.reponame-tips {
  color: var(--o-color-info3);
  // font-size: var(--o-font_size-tip2);
  @include tip1;
  margin-left: 16px;
}

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
