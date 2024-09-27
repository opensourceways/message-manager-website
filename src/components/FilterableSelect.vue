<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { OInput, OPopup, OCheckbox, OCheckboxGroup, OScroller, OIconChevronDown, OIconSearch, OIcon, OIconClose, OPopover } from '@opensig/opendesign';
import { useDebounceFn } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import type { PropType } from 'vue';
import useScrollBottomListener from '@/composables/useScrollBottomListener';

type ValueT = string | { label: string; value: string };

const props = defineProps({
  modelValue: {
    type: Array as PropType<(string | number)[]>,
    default: () => [],
  },
  clearable: {
    type: Boolean,
    default: true,
  },
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
  /**
   * 挂载容器，默认为body
   */
  optionsWrapper: {
    type: [String, Object] as PropType<string | HTMLElement | null>,
    default: 'body',
  },
  emptyHint: {
    type: String,
    default: '没有匹配的数据',
  },
});

const emit = defineEmits<{
  (event: 'change', values: (string | number)[]): void;
  (event: 'remove', val: string | number): void;
  (event: 'clear'): void;
  (event: 'visibilityChange', val: boolean): void;
  (event: 'update:modelValue', values: (string | number)[]): void;
}>();

const popupWidth = ref('');
const vUpdated = {
  updated(el: HTMLDivElement) {
    nextTick(() => {
      const { width } = el.getBoundingClientRect();
      popupWidth.value = `${width}px`;
    });
  },
};

const selectRef = ref();

const rawValues = computed(() => {
  return props.values.map((val) => {
    if (typeof val === 'string') {
      return { label: val, value: val, upperCaseLabel: val.toUpperCase() };
    }
    return { ...val, upperCaseLabel: val.label.toUpperCase() };
  });
});

/** 选中项的 value -> label 映射 */
const checkedValueLabelMap = ref(new Map<string, string>());

watch(
  rawValues,
  (val) => {
    if (val) {
      checkedValueLabelMap.value.clear();
      val.forEach((item) => {
        checkedValueLabelMap.value.set(item.value, item.label);
      });
    }
  },
  { immediate: true }
);

const searchVal = ref<string>();

const filteredValues = computed(() => {
  const search = searchVal.value;
  if (search) {
    return rawValues.value.filter((val) => val.upperCaseLabel.includes(search));
  } else {
    return rawValues.value;
  }
});

const displayCount = ref(30);
const displayValues = computed(() => {
  return filteredValues.value.slice(0, Math.min(filteredValues.value.length, displayCount.value));
});

const scroller = ref();
const { scrollTop } = useScrollBottomListener(scroller, () => (displayCount.value += 30));

const onFilterInput = useDebounceFn((search?: string) => {
  // 重置显示个数
  displayCount.value = 30;
  searchVal.value = search?.toUpperCase();
}, props.filterDebounceTimeout);

const { checkboxVal, checkAllVal, indeterminate, clearCheckboxes } = useCheckbox(
  () => rawValues.value,
  (item) => item.value
);
const isClearable = computed(() => props.clearable && checkboxVal.value.length > 0);

watch(() => props.values, clearCheckboxes);

watch(checkboxVal, (vals) => emit('update:modelValue', vals));

watch(
  () => props.modelValue,
  (vals) => {
    if (vals !== checkboxVal.value) {
      checkboxVal.value = vals;
    }
  }
);

const isSelecting = ref(false);

const onVisibleChange = (val: boolean) => {
  if (!val) {
    scrollTop();
    displayCount.value = 30;
  }
  isSelecting.value = val;
  emit('visibilityChange', val);
};

const onCheckboxChange = (value: string, label: string, e: Event) => {
  const { checked } = e.target as HTMLInputElement;
  if (!checked) {
    onRemoveTag(value);
  }
};

const onRemoveTag = (val: string | number) => {
  const idx = checkboxVal.value.indexOf(val as string);
  if (idx > -1) {
    checkboxVal.value.splice(idx, 1);
    emit('remove', val);
  }
};

const clearClick = (e: Event) => {
  e.stopPropagation();
  clearCheckboxes();
  nextTick(() => emit('clear'));
};
</script>

<template>
  <div
    ref="selectRef"
    v-updated
    :class="['select-head', 'o-select', 'o-select-normal', 'o-select-outline', 'o-select-medium', clearable ? 'o-select-clearable' : '']"
  >
    <input v-if="checkboxVal.length === 0" type="text" :placeholder="props.placeholder" class="o-select-input" readonly />
    <OScroller class="o-select-tags-scroller" wrap-class="o-select-value-list" show-type="hover" size="small" disabled-x>
      <div class="o-select-tags-wrap">
        <template v-if="checkboxVal.length">
          <template v-if="checkboxVal.length === 1">
            <div class="o-select-tag">
              {{ checkedValueLabelMap.get(checkboxVal[0] as string) }}
              <div class="o-select-tag-remove" @click.stop="onRemoveTag(checkboxVal[0])"><OIconClose /></div>
            </div>
          </template>
          <OPopover v-else :wrapper="optionsWrapper" trigger="hover" class="o-select-tag-popover" position="bottom" style="--popup-shadow: var(--o-shadow-1)">
            <template #target>
              <div class="o-select-tag">{{ checkboxVal.length }}个选项被选中</div>
            </template>
            <div class="o-select-tags">
              <div v-for="item in checkboxVal" :key="item" class="o-select-tag">
                {{ checkedValueLabelMap.get(item as string) }}
                <div class="o-select-tag-remove" @click.stop="onRemoveTag(item)"><OIconClose /></div>
              </div>
            </div>
          </OPopover>
        </template>
      </div>
    </OScroller>
    <div class="o-select-suffix">
      <div class="o-select-suffix-icon">
        <div v-if="isClearable" class="o-select-clear" @click.stop="clearClick"><OIconClose class="o-select-clear-icon" /></div>
        <div class="o-select-arrow" :class="{ active: isSelecting }">
          <OIconChevronDown />
        </div>
      </div>
    </div>
    <OPopup
      :target="selectRef"
      :unmountOnHide="false"
      :wrapper="optionsWrapper"
      position="bottom"
      trigger="click"
      @change="onVisibleChange"
      :style="{ '--popup-shadow': 'var(--o-shadow-1)', minWidth: popupWidth }"
    >
      <div style="box-shadow: var(--o-shadow-2); border-radius: var(--o-radius_control-m); background-color: var(--o-color-fill2); padding: 12px; border-radius: 4px; overflow: hidden">
        <div class="mask" v-if="!values.length">
          <p class="info">{{ emptyHint }}</p>
        </div>
        <OInput class="search-input" round="4px" @input="onFilterInput" clearable @clear="onFilterInput()" :placeholder="placeholder">
          <template #prefix>
            <OIcon style="font-size: 20px">
              <OIconSearch />
            </OIcon>
          </template>
        </OInput>
        <OScroller ref="scroller" class="scroller" showType="always">
          <div class="check-all-wrap">
            <OCheckbox v-model="checkAllVal" :indeterminate="indeterminate" :value="1">全选</OCheckbox>
          </div>
          <OCheckboxGroup v-model="checkboxVal" direction="v">
            <OCheckbox v-for="item in displayValues" :key="item.value" :value="item.value" @change="(_, ev) => onCheckboxChange(item.value, item.label, ev)">{{
              item.label
            }}</OCheckbox>
          </OCheckboxGroup>
        </OScroller>
      </div>
    </OPopup>
  </div>
</template>

<style lang="scss" scoped>
.mask {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--o-color-fill2);
  z-index: 2;
  left: 0;
  top: 0;

  .info {
    @include tip1;
    color: var(--o-color-info1);
  }
}

.select-head {
  border-radius: 4px;
  width: 100%;
}

.o-select-arrow {
  font-size: var(--select-icon-size);
  color: var(--select-icon-color);
  display: inline-flex;
  align-items: center;
  transform: rotate(0);
  transition: transform var(--o-duration-s) var(--o-easing-standard);

  &.active {
    transform: rotate(-180deg);
  }
  .o-select-disabled & {
    color: var(--select-icon-color-disabled);
  }
}

.scroller {
  margin-top: 12px;
  max-height: 180px;
}

.search-input {
  width: 100%;
}

.check-all-wrap {
  padding: 16px 0;
  padding-top: 0;
  background-color: var(--o-color-fill2);
}
</style>
