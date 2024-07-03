<script setup lang="ts">
import { ref, type Ref, computed } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = withDefaults(defineProps<{
  width?: string | number;
  height?: string | number;
  modelValue?: string[];
}>(), {
  // modelValue: () => ([]),
  width: 300,
  height: 126
});
const list = computed(() => props.modelValue ?? []);
const input = ref<HTMLDivElement>() as Ref<HTMLDivElement>;

function add() {
  const text = input.value.textContent?.trim();
  if (text) {
    const set = new Set(list.value);
    set.add(text);
    emit('update:modelValue', [...set]);
  }
  input.value.innerHTML = '';
}

function deleteItem(item: string) {
  const set = new Set(list.value);
  set.delete(item);
  emit('update:modelValue', [...set]);
}
</script>

<template>
  <div class="outer" >
    <div class="upper" v-show="list.length">
      <span v-for="item in list" :key="item">
        {{ item }}
        <img src="@/assets/svg-icons/icon-close.svg" @click="deleteItem(item)" />
      </span>
    </div>
    <div ref="input" class="lower" contenteditable="true"></div>
    <img src="@/assets/svg-icons/icon-add.svg" class="add-icon" @click="add">
  </div>
</template>

<style scoped lang="scss">
.outer {
  // cursor: text;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  width: 300px;
  min-height: 126px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 16px;
  position: relative;

  :deep(.o-textarea-textarea) {
    border: none
  }

  .add-icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    position: absolute;
    right: 16px;
    bottom: 8px;
  }

  .upper {
    display: flex;
    gap: 6px;
    width: 100%;
    flex-wrap: wrap;

    span {
      padding: 3px 12px;
      padding-right: 32px;
      max-width: 100%;
      word-break: break-all;
      background-color: #DEDEE3;
      border-radius: 4px;
      height: fit-content;
      font-size: 12px;
      line-height: 18px;
      position: relative;

      img {
        width: 16px;
        height: 16px;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
      }
    }
  }

  .lower {
    width: 100%;
    outline: none;
  }
}
</style>