<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue';
import { OForm, OFormItem } from '@opensig/opendesign';
import RadioToggle from '@/components/RadioToggle.vue';
import FilterableSelect from '@/components/FilterableSelect.vue';
import useSigFilter from '@/composables/useSigFilter';
import { useUserInfoStore } from '@/stores/user';

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

  if (val.repos) {
    selectedRepos.value = val.repos.split(',');
  }
  if (val.cve_affected) {
    affected.value = val.cve_affected.split(',');
  }
  if (val.cve_state) {
    cveState.value = val.cve_state;
  }
};

watch(webFilter, syncParams);

const versions = [
  'openeuler-20.03_LTS_SP1',
  'openeuler-20.03_LTS_SP3',
  'openeuler-20.03_LTS_SP4',
  'openeuler-20.09',
  'openeuler-21.03',
  'openeuler-21.09',
  'openeuler-22.03_LTS',
  'openeuler-22.03_LTS_SP1',
  'openeuler-22.03_LTS_SP2',
  'openeuler-22.03_LTS_SP3',
  'openeuler-22.03_LTS_SP4',
  'openeuler-22.09',
  'openeuler-23.03',
  'openeuler-23.09',
  'openeuler-24.03_LTS',
];

// ----------------sve状态----------------
const cveState = ref('');
const cveStateOptions = [
  { label: '待我处理的', value: 'open' },
  { label: '处理完成的', value: 'rejected,closed' },
];

// ----------------sig/repo----------------
const selectedRepos = ref<string[]>([]);

const repoList = computed(() => {
  if (selectedSigs.value.length) {
    return selectedSigs.value.flatMap((sig) => allSigReposMap.value.get(sig as string) ?? []);
  }
  return Array.from(allSigReposMap.value.values()).flat();
});

// ----------------系统版本----------------
const affected = ref<string[]>([]);

/**
 * 下拉选择可见性改变
 */
const onSelectVisibilityChange = (val: boolean) => {
  if (!val) {
    applyFilter();
  }
};

const reset = () => {
  selectedSigs.value = [];
  selectedRepos.value = [];
  affected.value = [];
  cveState.value = '';
};

const getFilterParams = (): Record<string, string> => {
  const params: Record<string, any> = {};
  if (sigBelong.value) {
    params[sigBelong.value] = userInfoStore.giteeLoginName as string;
  }
  if (selectedSigs.value?.length) {
    params.sig = selectedSigs.value.join();
  }
  if (selectedRepos.value?.length) {
    params.repos = selectedRepos.value.join();
  }
  if (cveState.value) {
    params.cve_state = cveState.value;
  }
  if (affected.value?.length) {
    params.cve_affected = affected.value.join();
  }
  return params;
};

defineExpose({
  reset,
  getFilterParams,
});
</script>

<template>
  <OForm style="margin-top: 16px; --form-item-gap: 16px" label-width="100px"  >
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
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
    <OFormItem label="组件仓">
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
    <OFormItem label="漏洞状态">
      <RadioToggle v-model="cveState" @change="applyFilter" enable-cancel-select :options="cveStateOptions" />
    </OFormItem>
    <OFormItem label="影响系统版本">
      <FilterableSelect
        v-model="affected"
        filterable
        clearable
        placeholder="请选择仓库"
        :values="versions"
        inputWidth="100%"
        :options-wrapper="popupContainer"
        @visibility-change="onSelectVisibilityChange"
        @clear="applyFilter"
        @remove="applyFilter"
      ></FilterableSelect>
    </OFormItem>
  </OForm>
</template>
