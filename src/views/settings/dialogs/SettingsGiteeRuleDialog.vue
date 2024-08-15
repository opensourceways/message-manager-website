<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue';
import { OButton, OCheckbox, OCheckboxGroup, ODialog, OForm, OFormItem, OInput, useMessage } from '@opensig/opendesign';
import SettingsTagsEditor from '../components/SettingsTagsEditor.vue';
import { postPushConfig, postSubsRule, putSubsRule } from '@/api/api-settings';
import type { GiteeModeFilterT, SubscribeRuleT } from '@/@types/type-settings';
import { EventSources, REPO_PROJ_NAME_PATTERN } from '@/data/event';
import { computed } from 'vue';
import { useUserInfoStore } from '@/stores/user';
import { diff } from '@/utils/common';

const emit = defineEmits<{
  (event: 'update:show', show: boolean): void;
  (event: 'updateData'): void;
}>();
const props = defineProps<{
  show: boolean;
}>();

const userInfoStore = useUserInfoStore();
const message = useMessage();

const repoNameEditor = ref();
const data = reactive({
  mode_name: '',
  mode_filter: {
    repo_name: [] as string[],
    is_bot: 'false' as 'false' | 'true' | undefined,
  },
});

const dialogData = inject<{
  dlgType: 'add' | 'edit';
  rule: SubscribeRuleT<GiteeModeFilterT>;
}>('dialogData');

const btnDisabled = computed(() => !data.mode_name || !repoNameEditor.value?.hasTags || !eventTypes.value.length || !isBot.value.length);

// --------------------事件类型下拉选择----------------
const eventTypesOptions = [
  { label: 'Push', value: 'push' },
  { label: 'Pull Request', value: 'pr' },
  { label: 'Issue', value: 'issue' },
  { label: '评论', value: 'note' },
];

let originalEventTypesAndIds: { id: string; eventType: string }[] = [];
const eventTypes = ref<string[]>([]);
// const deletedIds =

// --------------------是否机器人----------------
const isBot = ref<('true' | 'false')[]>([]);

watch(
  () => props.show,
  (show) => {
    if (show) {
      if (dialogData?.dlgType === 'edit') {
        const rule = dialogData?.rule;
        if (rule && rule.source === EventSources.GITEE) {
          data.mode_name = rule.mode_name;
          if (rule.eventTypesAndIds?.length) {
            eventTypes.value = rule.eventTypesAndIds.map((item) => item.eventType);
            originalEventTypesAndIds = [...rule.eventTypesAndIds];
          }
          if (rule.mode_filter) {
            data.mode_filter.repo_name = rule.mode_filter.repo_name;
            if (rule.mode_filter.is_bot === 'true') {
              isBot.value = ['true'];
            } else if (rule.mode_filter.is_bot === 'false') {
              isBot.value = ['false'];
            } else {
              isBot.value = ['true', 'false'];
            }
          }
        }
      }
      if (dialogData?.dlgType === 'add') {
        isBot.value = ['true', 'false'];
      }
    } else {
      data.mode_name = '';
      data.mode_filter = {
        repo_name: [],
        is_bot: 'false',
      };
      repoNameEditor.value.clear();
      isBot.value = [];
      eventTypes.value = [];
    }
  }
);

const onCancel = () => emit('update:show', false);

const onConfirm = async () => {
  data.mode_filter.repo_name = repoNameEditor.value.getTagValues();
  data.mode_filter.is_bot = isBot.value.length === 2 ? undefined : isBot.value[0];
  try {
    if (dialogData?.dlgType === 'add') {
      const { newId } = await postSubsRule({
        ...data,
        source: EventSources.GITEE,
        event_type: eventTypes.value.join(),
      });
      if (newId) {
        newId.forEach((subscribe_id) => postPushConfig({ recipient_id: userInfoStore.recipientId, subscribe_id }));
      }
    } else {
      const { added, same, removed } = diff(
        originalEventTypesAndIds.map((item) => item.eventType),
        eventTypes.value
      );
      const delete_info = removed.map((removedItem) => ({
        id: originalEventTypesAndIds.find((item) => item.eventType === removedItem)?.id as string
      }));
      const update_info = same.map(remainItem => ({
        event_type: remainItem,
        id: originalEventTypesAndIds.find((item) => item.eventType === remainItem)?.id as string
      }));
      const create_info = added.map((addItem) => ({
        event_type: addItem
      }));
      await putSubsRule({
        ...data,
        source: EventSources.GITEE,
        delete_info,
        update_info,
        create_info,
      });
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
    <template #header>{{ dialogData?.dlgType === 'add' ? '新增' : '编辑' }}消息接收规则</template>
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
              :regExp="REPO_PROJ_NAME_PATTERN"
              placeholder="请输入组织和仓库名称，按照“组织名/仓库名”的格式填写，按回车键结束输入"
              width="480px"
            />
            <p class="reponame-tips">若需关注所有仓库，使用“*”代替。示例：“openeuler/gcc”、“openeuler/*”</p>
          </div>
        </OFormItem>
        <OFormItem label="提交人" required>
          <OCheckboxGroup v-model="isBot">
            <OCheckbox value="true">机器人</OCheckbox>
            <OCheckbox value="false">非机器人</OCheckbox>
          </OCheckboxGroup>
        </OFormItem>
        <OFormItem label="消息类型" required>
          <OCheckboxGroup v-model="eventTypes">
            <OCheckbox v-for="item in eventTypesOptions" :key="item.value" :value="item.value">{{ item.label }}</OCheckbox>
          </OCheckboxGroup>
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
  width: 480px;
}

.input {
  --input-radius: 4px;
  width: 480px;
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
