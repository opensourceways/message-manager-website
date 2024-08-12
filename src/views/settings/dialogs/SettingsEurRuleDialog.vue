<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue';
import { OButton, ODialog, OForm, OFormItem, OInput, OOption, OSelect, useMessage } from '@opensig/opendesign';
import type { EurModeFilterT, SubscribeRuleT } from '@/@types/type-settings';
import { postPushConfig, postSubsRule, putSubsRule } from '@/api/api-settings';
import { EventSources, EUR_BUILD_STATUS, REPO_PROJ_NAME_PATTERN } from '@/data/event';
import SettingsTagsEditor from '../components/SettingsTagsEditor.vue';
import { useUserInfoStore } from '@/stores/user';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'updateData'): void;
}>();

const props = defineProps<{
  show: boolean;
}>();

const userInfoStore = useUserInfoStore();
const message = useMessage();

const data = reactive<{ mode_name: string; mode_filter: EurModeFilterT }>({
  mode_name: '',
  mode_filter: {
    status: [] as number[],
    source_group: [],
  },
});

const projectNameEditor = ref();
const dialogData = inject<{
  dlgType: 'add' | 'edit';
  eventType: string;
  rule: SubscribeRuleT<EurModeFilterT>;
}>('dialogData');

const btnDisabled = computed(() => !data.mode_name || !projectNameEditor.value?.hasTags || !data.mode_filter.status.length);

watch(
  () => props.show,
  (val) => {
    if (val && dialogData?.dlgType === 'edit') {
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

const onCancel = () => emit('update:show', false);

const onConfirm = async () => {
  data.mode_filter.source_group = projectNameEditor.value.getTagValues();
  try {
    const res = await (dialogData?.dlgType === 'add' ? postSubsRule : putSubsRule)({
      ...data,
      source: EventSources.EUR,
      event_type: 'build',
    });
    if (res && res.newId) {
      res.newId.forEach((subscribe_id) => postPushConfig({ recipient_id: userInfoStore.recipientId, subscribe_id }));
    }
    emit('updateData');
    onCancel();
  } catch {
    message.danger({ content: '添加失败' });
  }
};
</script>

<template>
  <ODialog :visible="show" @change="$emit('update:show', $event)" :unmount-on-hide="false">
    <template #header>{{ dialogData?.dlgType === 'add' ? '创建' : '修改' }}消息接收规则</template>
    <div class="dialog-content">
      <p class="dialog-content-title">消息接收规则命名</p>
      <OForm has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="规则名称" required>
          <OInput class="input" clearable v-model="data.mode_name" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">消息接收规则设置</p>
      <OForm has-required layout="h" label-align="top" label-justify="left" label-width="80px">
        <OFormItem label="项目名称" required>
          <div>
            <SettingsTagsEditor
              :tags="data.mode_filter.source_group"
              ref="projectNameEditor"
              placeholder="请按照“User/Project”的格式填写关注的项目，按回车键结束输入"
              :regExp="REPO_PROJ_NAME_PATTERN"
              width="480px"
            />
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
  @include tip1;
  margin-left: 16px;
  width: 480px;
}

.status-selector {
  border-radius: 4px;
  width: 480px;
}

.input {
  --input-radius: 4px;
  width: 480px;
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
