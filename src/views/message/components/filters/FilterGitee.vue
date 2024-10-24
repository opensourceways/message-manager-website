<script setup lang="ts">
import { getMyRepos } from '@/api/api-messages';
import FilterableSelect from '@/components/FilterableSelect.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import useSigFilter from '@/composables/useSigFilter';
import { useUserInfoStore } from '@/stores/user';
import { OForm, OFormItem, OOption, OSelect } from '@opensig/opendesign';
import { computed, nextTick, onBeforeMount, reactive, ref, watch } from 'vue';
import { filterProps, type FilterEmits } from './typs';

const props = defineProps(filterProps);
const emit = defineEmits<FilterEmits>();
const userInfoStore = useUserInfoStore();

const { sigBelong, sigBelongOptions, allSigReposMap, sigList, selectedSigs } = useSigFilter();

const sigSelectorRef = ref();

watch(sigBelong, (val) => {
  if (val === 'my_sig') {
    nextTick(() => sigSelectorRef.value?.checkAll());
  }
});

const filterParams = reactive({
  repoBelong: '',
  selectedRepos: [] as string[],
  eventType: '',
  isBot: '',
  eventRelation: '',
  eventState: '',
  noteType: '',
});

const params = computed({
  get() {
    const data: Record<string, string> = {};
    if (sigBelong.value) {
      data[sigBelong.value] = userInfoStore.giteeLoginName as string;
    }
    if (filterParams.repoBelong) {
      data[filterParams.repoBelong] = userInfoStore.giteeLoginName as string;
    }
    if (selectedSigs.value?.length) {
      data.sig = selectedSigs.value.join();
    }
    if (filterParams.selectedRepos?.length) {
      data.repos = filterParams.selectedRepos.join();
    }
    if (filterParams.eventType) {
      data.event_type = filterParams.eventType;
      if (filterParams.eventType === 'pr') {
        if (filterParams.eventState) {
          data.pr_state = filterParams.eventState;
        }
        if (filterParams.eventRelation) {
          data[`pr${filterParams.eventRelation}`] = userInfoStore.giteeLoginName as string;
        }
      }
      if (filterParams.eventType === 'issue') {
        if (filterParams.eventState) {
          data.issue_state = filterParams.eventState;
        }
        if (filterParams.eventRelation) {
          data[`issue${filterParams.eventRelation}`] = userInfoStore.giteeLoginName as string;
        }
      }
      if (filterParams.eventType === 'note' && filterParams.noteType) {
        data.note_type = filterParams.noteType;
      }
    }
    if (filterParams.isBot && filterParams.isBot !== 'all') {
      data.is_bot = filterParams.isBot;
    }
    return data;
  },
  set(val: Record<string, any>) {
    reset(false);
    if (val.sig) {
      selectedSigs.value = val.sig.split(',');
    }
    if (val.repos) {
      filterParams.selectedRepos = val.repos.split(',');
    }
    if (val.my_sig) {
      sigBelong.value = 'my_sig';
    } else if (val.other_sig) {
      sigBelong.value = 'other_sig';
    }
    if (val.my_management) {
      filterParams.repoBelong = 'my_management';
    } else if (val.other_management) {
      filterParams.repoBelong = 'other_management';
    }
    if (val.event_type) {
      filterParams.eventType = val.event_type;
    }
    if (val.is_bot) {
      filterParams.isBot = val.is_bot.toString();
    }
    nextTick(() => {
      if (val.pr_creator || val.issue_creator) {
        filterParams.eventRelation = '_creator';
      }
      if (val.pr_assignee || val.issue_assignee) {
        filterParams.eventRelation = '_assignee';
      }
      if (val.pr_state) {
        filterParams.eventState = val.pr_state;
      }
      if (val.issue_state) {
        filterParams.eventState = val.issue_state;
      }
      if (val.note_type) {
        filterParams.noteType = val.note_type;
      }
    });
  },
});

const applyFilter = () => emit('applyFilter', params.value);

watch(
  () => props.quickFilterDetail,
  (val) => {
    if (val) {
      params.value = val;
    }
  }
);

// ----------------repo归属----------------
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

const myRepoList = ref<string[]>([]);
const repoList = computed(() => {
  if (selectedSigs.value.length) {
    const repos = selectedSigs.value.flatMap((sig) => allSigReposMap.value.get(sig as string) ?? []);
    if (filterParams.repoBelong === 'my_management') {
      const set = new Set(myRepoList.value);
      return repos.filter((item) => set.has(item));
    }
    if (filterParams.repoBelong === 'other_management') {
      const set = new Set(myRepoList.value);
      return repos.filter((item) => !set.has(item));
    }
    return repos;
  }
  const repos = Array.from(allSigReposMap.value.values()).flat();
  if (filterParams.repoBelong === 'my_management') {
    const set = new Set(myRepoList.value);
    return repos.filter((item) => set.has(item));
  }
  if (filterParams.repoBelong === 'other_management') {
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
    applyFilter();
  }
};

// ----------------事件类型----------------
const eventTypes = [
  { label: 'Issue', value: 'issue' },
  { label: 'PR', value: 'pr' },
  { label: '评论', value: 'note' },
];

// ----------------提交人----------------
const isBotOptions = [
  { label: '全部', value: 'all' },
  { label: '非机器人', value: 'false' },
];

// ----------------事件关系----------------
const eventRelations = [
  { label: '我创建的', value: '_creator' },
  { label: '指派给我的', value: '_assignee' },
];

// ----------------事件状态----------------
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
  if (filterParams.eventType === 'pr') {
    return prState;
  }
  if (filterParams.eventType === 'issue') {
    return issueState;
  }
  return [];
});
watch(displayEventState, () => (filterParams.eventState = ''));

// ----------------评论归属----------------
const noteTypes = ['Issue', 'PullRequest', 'Commit'];

const reset = (shouldApply = true) => {
  sigBelong.value = '';
  selectedSigs.value = [];
  filterParams.selectedRepos = [];
  filterParams.repoBelong = '';
  filterParams.eventType = '';
  filterParams.isBot = '';
  filterParams.eventState = '';
  filterParams.eventRelation = '';
  filterParams.noteType = '';
  if (shouldApply) {
    applyFilter();
  }
};

defineExpose({
  reset,
  params,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px">
    <OFormItem label="SIG归属">
      <RadioToggle v-model="sigBelong" enable-cancel-select :options="sigBelongOptions" />
    </OFormItem>
    <OFormItem label="SIG名称">
      <FilterableSelect
        ref="sigSelectorRef"
        v-model="selectedSigs"
        filterable
        clearable
        placeholder="请选择SIG组"
        emptyHint="您暂未加入任何SIG"
        :options="sigList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="仓库归属">
      <RadioToggle v-model="filterParams.repoBelong" enable-cancel-select :options="repoBelongOptions" />
    </OFormItem>
    <OFormItem label="仓库名称">
      <FilterableSelect
        v-model="filterParams.selectedRepos"
        filterable
        clearable
        placeholder="请输入仓库名"
        :options="repoList"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="事件类型">
      <RadioToggle v-model="filterParams.eventType" @change="applyFilter" enable-cancel-select :options="eventTypes" />
    </OFormItem>
    <template v-if="filterParams.eventType === 'pr' || filterParams.eventType === 'issue'">
      <OFormItem label="事件关系">
        <RadioToggle v-model="filterParams.eventRelation" @change="applyFilter" enable-cancel-select :options="eventRelations" />
      </OFormItem>
      <OFormItem label="事件状态">
        <OSelect
          v-model="filterParams.eventState"
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
    <OFormItem v-if="filterParams.eventType === 'note'" label="评论归属">
      <OSelect
        v-model="filterParams.noteType"
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
      <RadioToggle v-model="filterParams.isBot" @change="applyFilter" enable-cancel-select :options="isBotOptions" />
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
