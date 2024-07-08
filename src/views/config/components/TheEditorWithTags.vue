<script setup lang="ts">
// 组件不以The开头
// TODO:考虑该组件的使用场景，尽量使用数据驱动
import { ref, type Ref, onMounted, watch } from 'vue';

withDefaults(defineProps<{
  width?: string | number;
  height?: string | number;
  placeholder?: string;
  showAddButton?: boolean;
}>(), {
  placeholder: '',
  width: 300,
  height: 126
});
// TODO:不要此处使用as
const input = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const tagSet = ref(new Set<string>());

const OBERVER_CONFIG = { childList: true };
const tagsRemovedObserver = new MutationObserver(([mut]) => {
  if (mut.removedNodes.length) {
    mut.removedNodes.forEach(node => {
      if (node instanceof HTMLSpanElement && node.classList.contains('tag')) {
        tagSet.value.delete(node.textContent as string);
      }
    });
  }
});

onMounted(() => tagsRemovedObserver.observe(input.value, OBERVER_CONFIG));
const showPlaceHolder = ref(true);

watch(() => tagSet.value.size, size => {
  if (size === 0) {
    showPlaceHolder.value = true;
  } else {
    showPlaceHolder.value = false;
  }
});
// TODO:建议使用函数表达式定义函数
function getTagValues() {
  const result: string[] = [];
  input.value.querySelectorAll('span.tag').forEach(tag => result.push(tag.textContent as string));
  return result;
}
// TODO:建议使用函数表达式定义函数
function deleteTag(event: MouseEvent) {
  const tag = (event.target as HTMLImageElement).parentElement as HTMLSpanElement;
  input.value.removeChild(tag);
}
// TODO:建议使用函数表达式定义函数
function addTag() {
  const last = input.value.lastChild;
  let text;
  if (last?.nodeType === Node.TEXT_NODE) {
    text = last.textContent?.trim();
  } else if (last instanceof HTMLSpanElement && last.className !== 'tag') {
    text = last.textContent?.trim();
  }
  if (!text || tagSet.value.has(text)) {
    return;
  }
  tagSet.value.add(text);
  tagsRemovedObserver.disconnect()
  input.value.innerHTML = '';
  appenTags();
}
// TODO:建议使用函数表达式定义函数
function appenTags() {
  for (const text of tagSet.value) {
    const tag = document.createElement('span');
    tag.classList.add('tag');
    tag.textContent = text;
    tag.contentEditable = 'false';
    const icon = document.createElement('img');
    icon.src = '/src/assets/svg-icons/icon-close.svg';
    icon.classList.add('close');
    icon.addEventListener('click', deleteTag);
    // TODO:为何需要使用appendChild
    tag.appendChild(icon);
    input.value.appendChild(tag);
  }
  input.value.appendChild(document.createElement('span'));
  tagsRemovedObserver.observe(input.value, OBERVER_CONFIG);
}
// TODO:建议使用函数表达式定义函数
function onClick() {
  const sel = document.getSelection();
  if (!sel || !sel.anchorNode) {
    return;
  }
  const parent = sel.anchorNode.parentElement;
  if (parent && parent.classList.contains('tag')) {
    const range = document.createRange();
    range.setStartAfter(parent);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
// TODO:建议使用函数表达式定义函数
function onFocus() {
  showPlaceHolder.value = false;
}
// TODO:建议使用函数表达式定义函数
function onBlur() {
  if (tagSet.value.size === 0) {
    showPlaceHolder.value = true;
  }
}

defineExpose({
  getTagValues,
})
</script>

<template>
  <!-- 建议外层class与业务关联 -->
  <div class="outer">
    <p v-if="showPlaceHolder" class="placeholder">{{ placeholder }}</p>
    <!-- svg可以使用icon组件 -->
    <img src="@/assets/svg-icons/icon-add.svg" class="add-icon" @click="addTag">
    <div class="input" ref="input" contenteditable="true" @focus="onFocus" @blur="onBlur" @click="onClick"></div>
  </div>
</template>

<style scoped lang="scss">
// TODO:为何需要deep
:deep(.tag) {
  padding: 3px 12px;
  padding-right: 32px;
  max-width: 100%;
  background-color: #DEDEE3;
  border-radius: 4px;
  height: fit-content;
  font-size: 12px;
  line-height: 18px;
  position: relative;
  width: fit-content;
  margin-right: 10px;

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

.outer {
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  width: 300px;
  min-height: 126px;
  padding: 8px 16px;
  position: relative;
  display: flex;
  flex-direction: column;

  .input {
    width: 100%;
    outline: none;
    flex-grow: 1;
  }

  .placeholder {
    position: absolute;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.4);
  }

  .add-icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    position: absolute;
    right: 16px;
    bottom: 8px;
  }
}
</style>