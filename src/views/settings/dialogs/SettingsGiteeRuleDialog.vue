<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue';
import { OButton, ODialog, OForm, OFormItem, OInput, ORadio } from '@opensig/opendesign';
import SettingsTagsEditor from '../components/SettingsTagsEditor.vue';
import { postSubsRule, putSubsRule } from '@/api/api-settings';
import type { GiteeModeFilterT, SubscribeRuleT } from '@/@types/type-settings';
import { EventSources } from '@/data/event';
import { computed } from 'vue';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'updateData'): void;
}>();
const props = defineProps<{
  show: boolean;
}>();

const repoNameEditor = ref();
const data = reactive({
  mode_name: '',
  mode_filter: {
    repo_name: [] as string[],
    is_bot: false,
  },
});

const dialogData = inject<{
  dlgType: 'add' | 'edit';
  eventType: string;
  rule: SubscribeRuleT<GiteeModeFilterT>;
}>('dialogData');

const btnDisabled = computed(() => !data.mode_name || !repoNameEditor.value?.hasTags);

watch(
  () => props.show,
  (show) => {
    if (show) {
      const rule = dialogData?.rule;
      if (rule && rule.source === EventSources.GITEE) {
        data.mode_name = rule.mode_name;
        if (rule.mode_filter) {
          data.mode_filter.repo_name = rule.mode_filter.repo_name;
          data.mode_filter.is_bot = rule.mode_filter.is_bot;
        }
      }
    } else {
      data.mode_name = '';
      data.mode_filter = {
        repo_name: [],
        is_bot: false,
      };
      repoNameEditor.value.clear();
    }
  }
);

const onCancel = () => emit('update:show', false);

const onConfirm = () => {
  data.mode_filter.repo_name = repoNameEditor.value.getTagValues();
  (dialogData?.dlgType === 'add' ? postSubsRule : putSubsRule)({
    ...data,
    source: EventSources.GITEE,
    event_type: dialogData?.eventType,
  }).then(() => {
    emit('updateData');
    onCancel();
  });
};
</script>

<template>
  <ODialog :visible="show" @change="$emit('update:show', $event)" :unmount-on-hide="false">
    <template #header>{{ dialogData?.dlgType === 'add'? '新增' : '编辑' }}消息接收规则</template>
    <div class="dialog-content">
      <p class="dialog-content-title">消息接收规则命名</p>
      <OForm class="content-form" has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="规则名称" required>
          <OInput class="input" clearable v-model="data.mode_name" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">消息接收规则设置</p>
      <OForm class="content-form" has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="仓库名称" required>
          <div>
            <SettingsTagsEditor
              :tags="data.mode_filter.repo_name"
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
    <template #footer>
      <div class="dialog-footer">
        <OButton :disabled="btnDisabled" variant="solid" round="pill" size="large" color="primary" @click="onConfirm">确定</OButton>
        <OButton class="right-btn" variant="outline" round="pill" size="large" color="primary" @click="onCancel">取消</OButton>
      </div>
    </template>
  </ODialog>
</template>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: center;

  .right-btn {
    margin-left: 16px;
  }
}

.reponame-tips {
  color: var(--o-color-info3);
  font-size: var(--o-font_size-tip2);
  margin-left: 16px;
}

.input {
  --input-radius: 4px;
  width: 100%;
}

.dialog-content {
  .dialog-content-title {
    @include text1;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 16px;
  }
}
</style>
