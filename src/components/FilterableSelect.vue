<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { OInput, OPopup, OCheckbox, OCheckboxGroup } from '@opensig/opendesign';
import { useDebounceFn } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import type { PropType } from 'vue';
import AppScroller from './AppScroller.vue';

type ValueT = string | { label: string; value: string };

const props = defineProps({
  /** 是否显示筛选输入 */
  filterable: {
    type: Boolean,
    default: true,
  },
  /** 多选值 */
  values: {
    type: Array as PropType<ValueT[]>,
    default: () => [],
  },
  filterDebounceTimeout: {
    type: Number,
    default: 300,
  },
  placeholder: {
    type: String,
    default: '',
  },
  inputWidth: {
    type: String,
    default: '',
  },
  /**
   * 挂载容器，默认为body
   */
  optionsWrapper: {
    type: [String, Object] as PropType<string | HTMLElement | null>,
    default: 'body',
  },
});

const emit = defineEmits<{
  (event: 'change', values: (string | number)[]): void;
}>();

const rawValues = computed(() =>
  props.values.map((val) => {
    if (typeof val === 'string') {
      return { label: val, value: val };
    }
    return val;
  })
);

const searchVal = ref<string>();

const filteredValues = computed(() => {
  const search = searchVal.value;
  if (search) {
    return rawValues.value.filter((val) => val.label.includes(search));
  } else {
    return rawValues.value;
  }
});

const displayCount = ref(30);
const displayValues = computed(() => {
  return filteredValues.value.slice(0, Math.min(filteredValues.value.length, displayCount.value));
});

const scroller = ref();

const onScrollBottom = () => {
  displayCount.value += 30;
};

const onFilterInput = useDebounceFn((search?: string) => {
  // 重置显示个数
  displayCount.value = 30;
  searchVal.value = search;
}, props.filterDebounceTimeout);

const { checkboxes, parentCheckbox, indeterminate } = useCheckbox(
  () => rawValues.value,
  (item) => item.value
);

const onVisibleChange = (val: boolean) => {
  if (!val) {
    scroller.value?.scrollTop();
    displayCount.value = 30;
  }
};

watch(checkboxes, (values) => emit('change', values));
</script>

<template>
  <OPopup :wrapper="props.optionsWrapper" position="bottom" trigger="click" @change="onVisibleChange" style="--popup-shadow: var(--o-shadow-1)">
    <template #target>
      <OInput :style="{ '--input-radius': '4px', width: inputWidth ?? '100%' }" @input="onFilterInput" clearable @clear="onFilterInput()" :placeholder="placeholder"></OInput>
    </template>
    <AppScroller @scrollBottom="onScrollBottom" ref="scroller">
      <div class="check-all-wrap">
        <OCheckbox v-model="parentCheckbox" :indeterminate="indeterminate" :value="1">全选</OCheckbox>
      </div>
      <OCheckboxGroup v-model="checkboxes" direction="v">
        <OCheckbox v-for="item in displayValues" :key="item.value" :value="item.value">{{ item.label }}</OCheckbox>
      </OCheckboxGroup>
    </AppScroller>
  </OPopup>
</template>

<style lang="scss" scoped>
.filter-input {
  --input-radius: 4px;
  width: 100%;
}

.check-all-wrap {
  padding: 16px 0;
  padding-top: 0;
}
</style>