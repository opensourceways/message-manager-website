<script setup lang="ts">
import { getMyRepos } from '@/api/messages';
import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import useSigFilter from '@/composables/useSigFilter';
import { useUserInfoStore } from '@/stores/user';
import { OForm, OFormItem, OOption, OSelect } from '@opensig/opendesign';
import { computed, inject, nextTick, onBeforeMount, ref, watch, type Ref } from 'vue';

const userInfoStore = useUserInfoStore();
const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter', () => {});

const { sigBelong, sigBelongOptions, allSigReposMap, sigList, selectedSigs } = useSigFilter();

const webFilter = inject<Ref<Record<string, any> | undefined>>('webFilter', ref());

const syncParams = (val: Record<string, any>) => {
  if (!val || !Object.keys(val).length) {
    return;
  }
  if (val.sig) {
    selectedSigs.value = val.sig.split(',');
  }
  if (val.repos) {
    selectedRepos.value = val.repos.split(',');
  }
  if (val.my_sig) {
    sigBelong.value = 'my_sig';
  } else if (val.other_sig) {
    sigBelong.value = 'other_sig';
  }
  if (val.my_management) {
    repoBelong.value = 'my_management';
  } else if (val.other_management) {
    repoBelong.value = 'other_management';
  }
  if (val.event_type) {
    eventType.value = val.event_type;
  }
  if (val.is_bot) {
    isBot.value = val.is_bot.toString();
  }
  nextTick(() => {
    if (val.pr_creator || val.issue_creator) {
      eventRelation.value = '_creator';
    }
    if (val.pr_assignee || val.issue_assignee) {
      eventRelation.value = '_assignee';
    }
    if (val.pr_state) {
      eventState.value = val.pr_state;
    }
    if (val.issue_state) {
      eventState.value = val.issue_state;
    }
    if (val.note_type) {
      noteType.value = val.note_type;
    }
  });
};

watch(webFilter, syncParams);

// ----------------repo归属----------------
const repoBelong = ref<'my_management' | 'other_management' | '' | undefined>();
const repoBelongOptions = [
  { label: '我管理的仓库', value: 'my_management' },
  { label: '其他仓库', value: 'other_management' },
];

// ----------------sig/repo----------------
onBeforeMount(() => {
  getMyRepos(userInfoStore.giteeLoginName as string).then((repos) => {
    if (repos?.length) {
      myRepoList.value = repos;
    }
  });
});

const selectedRepos = ref<string[]>([]);
const myRepoList = ref<string[]>([]);
const repoList = computed(() => {
  if (selectedSigs.value.length) {
    const repos = selectedSigs.value.flatMap((sig) => allSigReposMap.value.get(sig as string) ?? []);
    if (repoBelong.value === 'my_management') {
      const set = new Set(myRepoList.value);
      return repos.filter((item) => set.has(item));
    }
    if (repoBelong.value === 'other_management') {
      const set = new Set(myRepoList.value);
      return repos.filter((item) => !set.has(item));
    }
    return repos;
  }
  const repos = Array.from(allSigReposMap.value.values()).flat();
  if (repoBelong.value === 'my_management') {
    const set = new Set(myRepoList.value);
    return repos.filter((item) => set.has(item));
  }
  if (repoBelong.value === 'other_management') {
    const set = new Set(myRepoList.value);
    return repos.filter((item) => !set.has(item));
  }
  return repos;
});

/**
 * 下拉选择可见性改变
 */
const onSelectVisibilityChange = (val: boolean) => {
  if (!val) {
    if (applyFilter) {
      applyFilter();
    }
  }
};

// ----------------事件类型----------------
const eventType = ref('');
const eventTypes = [
  { label: 'Issue', value: 'issue' },
  { label: 'PR', value: 'pr' },
  { label: '评论', value: 'note' },
];

// ----------------提交人----------------
const isBot = ref('');
const isBotOptions = [
  { label: '全部', value: 'all' },
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
watch(displayEventState, () => (eventState.value = ''));

// ----------------评论归属----------------
const noteType = ref('');
const noteTypes = ['Issue', 'PullRequest', 'Commit'];

const reset = () => {
  sigBelong.value = '';
  repoBelong.value = '';
  selectedSigs.value = [];
  selectedRepos.value = [];
  eventType.value = '';
  isBot.value = '';
  eventState.value = '';
  eventRelation.value = '';
  noteType.value = '';
  applyFilter();
};

const getFilterParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  if (sigBelong.value) {
    params[sigBelong.value] = userInfoStore.giteeLoginName as string;
  }
  if (repoBelong.value) {
    params[repoBelong.value] = userInfoStore.giteeLoginName as string;
  }
  if (selectedSigs.value?.length) {
    params.sig = selectedSigs.value.join();
  }
  if (selectedRepos.value?.length) {
    params.repos = selectedRepos.value.join();
  }
  if (eventType.value) {
    params.event_type = eventType.value;
  }
  if (isBot.value && isBot.value !== 'all') {
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
    <OFormItem label="SIG归属">
      <RadioToggle v-model="sigBelong" enable-cancel-select :options="sigBelongOptions" />
    </OFormItem>
    <OFormItem label="SIG名称">
      <FilterableSelect
        v-model="selectedSigs"
        filterable
        clearable
        placeholder="请选择SIG组"
        :values="sigList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="仓库归属">
      <RadioToggle v-model="repoBelong" enable-cancel-select :options="repoBelongOptions" />
    </OFormItem>
    <OFormItem label="仓库名称">
      <FilterableSelect
        v-model="selectedRepos"
        filterable
        clearable
        placeholder="请选择仓库"
        :values="repoList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="事件类型">
      <RadioToggle v-model="eventType" @change="applyFilter" enable-cancel-select :options="eventTypes" />
    </OFormItem>
    <template v-if="eventType === 'pr' || eventType === 'issue'">
      <OFormItem label="事件关系">
        <RadioToggle v-model="eventRelation" @change="applyFilter" enable-cancel-select :options="eventRelations" />
      </OFormItem>
      <OFormItem label="事件状态">
        <OSelect
          v-model="eventState"
          @options-visible-change="onSelectVisibilityChange"
          clearable
          @clear="applyFilter"
          option-position="bottom"
          style="width: 100%; --select-radius: 4px"
          :options-wrapper="popupContainer"
        >
          <OOption v-for="item in displayEventState" :key="item.value" :value="item.value" :label="item.label">
            {{ item.label }}
          </OOption>
        </OSelect>
      </OFormItem>
    </template>
    <OFormItem v-if="eventType === 'note'" label="评论归属">
      <OSelect
        v-model="noteType"
        @options-visible-change="onSelectVisibilityChange"
        clearable
        option-position="bottom"
        style="width: 100%; --select-radius: 4px"
        :options-wrapper="popupContainer"
      >
        <OOption v-for="item in noteTypes" :key="item" :value="item" :label="item">
          {{ item }}
        </OOption>
      </OSelect>
    </OFormItem>
    <OFormItem label="提交人">
      <RadioToggle v-model="isBot" @change="applyFilter" enable-cancel-select :options="isBotOptions" />
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
