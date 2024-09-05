<script setup lang="ts">
import { getAllSigs } from '@/api/messages';
import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import { useUserInfoStore } from '@/stores/user';
import { OForm, OFormItem, OOption, OSelect } from '@opensig/opendesign';
import { computed, inject, onBeforeMount, ref, watch, type Ref } from 'vue';

const userInfoStore = useUserInfoStore();
const popupContainer = inject<Ref<HTMLElement>>('popupContainer');

// ----------------sig/repo----------------
const allSigReposMap = ref(new Map<string, string[]>());
onBeforeMount(() => {
  getAllSigs().then(data => {
    for (const item of data) {
      allSigReposMap.value.set(item.sig_name, item.repos);
    }
  });
});

const sigList = computed(() => Array.from(allSigReposMap.value.keys()));
const repoList = computed(() => {
  if (selectedSigs.value.length) {
    return selectedSigs.value.flatMap((sig) => allSigReposMap.value.get(sig as string) ?? []);
  }
  return Array.from(allSigReposMap.value.values()).flat();
});
const selectedSigs = ref<string[]>([]);
const selectedRepos = ref<string[]>([]);

const onSigChange = (sigs: (string | number)[]) => {
  selectedSigs.value = sigs as string[];
};

const onRepoChange = (val: (string | number)[]) => {
  selectedRepos.value = val as string[];
};

// ----------------事件类型----------------
const eventType = ref('');
const eventTypes = [
  { label: 'Issue',value: 'issue' },
  { label: 'PR',value: 'pr' },
  { label: '评论',value: 'note' },
];

// ----------------提交人----------------
const isBot = ref();
const isBotOptions = [
  { label: '全部', value: '' },
  { label: '非机器人', value: 'false' },
];

// ----------------事件关系----------------
const eventRelation = ref('');
const eventRelations = [
  { label: '我创建的', value: '_creator' },
  { label: '指派给我的', value: '_assignee' },
];

// ----------------事件状态----------------
const eventState = ref('');

const issueState = [
  { value: 'open', label: '待办的' },
  { value: 'progressing', label: '进行中' },
  { value: 'closed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' },
];

const prState = [
  { value: 'open', label: '开启' },
  { value: 'closed', label: '关闭' },
  { value: 'can_be_merged', label: '可合并' },
  { value: 'set_draft', label: '草稿' },
];

const displayEventState = computed(() => {
  if (eventType.value === 'pr') {
    return prState;
  }
  if (eventType.value === 'issue') {
    return issueState;
  }
  return [];
});
watch(displayEventState, () => eventState.value = '');

// ----------------评论归属----------------
const noteType = ref('');
const noteTypes = [
  'Issue',
  'PullRequest',
  'Commit',
];


const reset = () => {
  selectedSigs.value = [];
  selectedRepos.value = [];
  eventType.value = '';
  isBot.value = null;
  eventState.value = '';
  eventRelation.value = '';
  noteType.value = '';
};

const getFilterParams = () => {
  const params: Record<string, string> = {};
  if (selectedSigs.value?.length) {
    params.sig = selectedSigs.value.join();
  }
  if (selectedRepos.value?.length) {
    params.repos = selectedRepos.value.join();
  }
  if (eventType.value) {
    params.event_type = eventType.value;
  }
  if (isBot.value) {
    params.is_bot = isBot.value;
  }
  if (eventType.value === 'pr') {
    if (eventState.value) {
      params.pr_state = eventState.value;
    }
    if (eventRelation.value) {
      params[`pr${eventRelation.value}`] = userInfoStore.giteeLoginName as string;
    }
  }
  if (eventType.value === 'issue') {
    if (eventState.value) {
      params.issue_state = eventState.value;
    }
    if (eventRelation.value) {
      params[`pr${eventRelation.value}`] = userInfoStore.giteeLoginName as string;
    }
  }
  if (eventType.value === 'note' && noteType.value) {
    params.note_type = noteType.value;
  }
  return params;
};

defineExpose({
  reset,
  getFilterParams,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="SIG组">
      <FilterableSelect filterable :values="sigList" inputWidth="100%" :options-wrapper="popupContainer" @change="onSigChange"></FilterableSelect>
    </OFormItem>
    <OFormItem label="仓库">
      <FilterableSelect filterable :values="repoList" inputWidth="100%" :options-wrapper="popupContainer" @change="onRepoChange"></FilterableSelect>
    </OFormItem>
    <OFormItem label="事件类型">
      <RadioToggle v-model="eventType" :options="eventTypes" />
    </OFormItem>
    <template v-if="eventType === 'pr' || eventType === 'issue'">
      <OFormItem label="事件关系">
        <RadioToggle v-model="eventRelation" :options="eventRelations" />
      </OFormItem>
      <OFormItem label="事件状态">
        <OSelect v-model="eventState" clearable option-position="bottom" style="width: 100%; --select-radius: 4px" :options-wrapper="popupContainer">
          <OOption v-for="item in displayEventState" :key="item.value" :value="item.value" :label="item.label">
            {{ item.label }}
          </OOption>
        </OSelect>
      </OFormItem>
    </template>
    <OFormItem v-if="eventType === 'note'" label="评论归属">
      <OSelect v-model="noteType" clearable option-position="bottom" style="width: 100%; --select-radius: 4px" :options-wrapper="popupContainer">
        <OOption v-for="item in noteTypes" :key="item" :value="item" :label="item">
          {{ item }}
        </OOption>
      </OSelect>
    </OFormItem>
    <OFormItem label="提交人">
      <RadioToggle v-model="isBot" :options="isBotOptions" />
    </OFormItem>
  </OForm>
</template>

<style lang="scss" scoped>
.filter-container {
  position: relative;

  .sec-title {
    @include text1;

    &:first-child {
      margin-bottom: 16px;
    }

    &:not(:first-child) {
      margin-top: 16px;
    }
  }
}
</style>
