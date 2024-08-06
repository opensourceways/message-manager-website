<script setup lang="ts">
import type { EurModeFilterT, SubscribeRuleT } from '@/@types/type-settings';
import { ODialog, OForm, OFormItem, OInput, OOption, OSelect, type DialogActionT } from '@opensig/opendesign';
import { inject, reactive, ref, watch } from 'vue';
import SettingsTagsEditor from '../components/SettingsTagsEditor.vue';
import { EventSources, EUR_BUILD_STATUS } from '@/data/subscribeSettings';
import { postSubsRule, putSubsRule } from '@/api/api-settings';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'updateData'): void;
}>();

const props = defineProps<{
  show: boolean;
}>();

const data = reactive<{ mode_name: string; mode_filter: EurModeFilterT }>({
  mode_name: '',
  mode_filter: {
    status: [] as number[],
    source_group: [],
  },
});

const dialogData = inject<{
  dlgType: 'add' | 'edit';
  eventType: string;
  rule: SubscribeRuleT<EurModeFilterT>;
}>('dialogData');

watch(
  () => props.show,
  (val) => {
    if (val) {
      const rule = dialogData?.rule;
      if (rule && rule.source === EventSources.EUR) {
        data.mode_name = rule.mode_name;
        if (rule.mode_filter) {
          data.mode_filter.status = rule.mode_filter.status;
          data.mode_filter.source_group = rule.mode_filter.source_group;
        }
      }
    } else {
      data.mode_name = '';
      data.mode_filter.status = [];
      data.mode_filter.source_group = [];
      projectNameEditor.value.clear();
    }
  }
);

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
      (dialogData?.dlgType === 'add' ? postSubsRule : putSubsRule)({
        ...data,
        source: EventSources.EUR,
        event_type: dialogData?.eventType,
      }).then(() => {
        emit('updateData');
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
      <OForm class="content-form" has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="规则名称" required>
          <OInput class="input" clearable v-model="data.mode_name" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">消息接收规则设置</p>
      <OForm class="content-form" has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="项目名称" required>
          <div>
            <SettingsTagsEditor ref="projectNameEditor" style="width: 100%" placeholder="请按照“User/Project”的格式填写关注的项目，按回车键结束输入" />
            <p class="reponame-tips">若需关注所有项目，使用“*”代替。示例：“lihua/testProject”、“lihua/*”</p>
          </div>
        </OFormItem>
        <OFormItem label="构建状态" required>
          <OSelect class="status-selector" v-model="data.mode_filter.status" multiple variant="outline" placeholder="请选择构建状态" clearable>
            <OOption v-for="item in EUR_BUILD_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </OSelect>
        </OFormItem>
      </OForm>
    </div>
  </ODialog>
</template>

<style scoped lang="scss">
.reponame-tips {
  color: var(--o-color-info3);
  @include tip1;
  margin-left: 16px;
}

.status-selector {
  width: 100%;
  border-radius: 4px;
}

.input {
  --input-radius: 4px;
  width: 100%;
}

.dialog-content {
  .dialog-content-title {
    font-size: 16px;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 16px;
  }
}
</style>
