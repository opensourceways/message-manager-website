<script setup lang="ts">
import { computed, inject, onBeforeMount, ref, type Ref } from 'vue';
import { OForm, OFormItem } from '@opensig/opendesign';
import RadioToggle from '@/components/RadioToggle.vue';
import FilterableSelect from '@/components/FilterableSelect.vue';
import useSigFilter from '@/composables/useSigFilter';

const popupContainer = inject<Ref<HTMLElement>>('popupContainer');
const applyFilter = inject<() => void>('applyFilter');

const {
  sigBelong,
  sigBelongOptions,
  allSigReposMap,
  sigList,
  getSigs,
  selectedSigs,
} = useSigFilter();

const versions = [
  'openeuler-20.03_LTS_SP1-aarch64',
  'openeuler-20.03_LTS_SP1-x86_64',
  'openeuler-20.03_LTS_SP3-aarch64',
  'openeuler-20.03_LTS_SP3-x86_64',
  'openeuler-20.03_LTS_SP4-aarch64',
  'openeuler-20.03_LTS_SP4-x86_64',
  'openeuler-20.09-aarch64',
  'openeuler-20.09-x86_64',
  'openeuler-21.03-aarch64',
  'openeuler-21.03-x86_64',
  'openeuler-21.09-aarch64',
  'openeuler-21.09-x86_64',
  'openeuler-22.03_LTS-aarch64',
  'openeuler-22.03_LTS-x86_64',
  'openeuler-22.03_LTS_SP1-aarch64',
  'openeuler-22.03_LTS_SP1-x86_64',
  'openeuler-22.03_LTS_SP2-aarch64',
  'openeuler-22.03_LTS_SP2-x86_64',
  'openeuler-22.03_LTS_SP3-aarch64',
  'openeuler-22.03_LTS_SP3-x86_64',
  'openeuler-22.03_LTS_SP4-aarch64',
  'openeuler-22.03_LTS_SP4-x86_64',
  'openeuler-22.09-aarch64',
  'openeuler-22.09-x86_64',
  'openeuler-23.03-aarch64',
  'openeuler-23.03-x86_64',
  'openeuler-23.09-aarch64',
  'openeuler-23.09-x86_64',
  'openeuler-24.03_LTS-aarch64',
  'openeuler-24.03_LTS-x86_64',
];

// ----------------sve状态----------------
const cveState = ref('');
const cveStateOptions = [
  { label: '待我处理的', value: 'open' },
  { label: '处理完成的', value: 'rejected,closed' }
];

// ----------------sig/repo----------------
onBeforeMount(getSigs);
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
    if (applyFilter) {
      applyFilter();
    }
  }
};

const onSelectClear = () => {
  if (applyFilter) {
    applyFilter();
  }
};

const onSelectRemove = () => {
  if (applyFilter) {
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
  if (selectedSigs.value?.length) {
    if (sigBelong.value === 'mySig') {
      params.my_sig = selectedSigs.value.join();
    } else {
      params.sig = selectedSigs.value.join();
    }
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
        @clear="onSelectClear"
        @remove="onSelectRemove"
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
        @clear="onSelectClear"
        @remove="onSelectRemove"
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
        @clear="onSelectClear"
        @remove="onSelectRemove"
      ></FilterableSelect>
    </OFormItem>
  </OForm>
</template>