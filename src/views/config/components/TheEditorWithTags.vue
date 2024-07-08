<script setup lang="ts">
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

function getTagValues() {
  return [...tagSet.value];
}

function deleteTag(event: MouseEvent) {
  const tagWrapper = (event.target as HTMLImageElement).parentElement?.parentElement as HTMLSpanElement;
  input.value.removeChild(tagWrapper);
}

function addTag(event?: KeyboardEvent) {
  if (event) {
    event.preventDefault();
  }
  const sel = window.getSelection();
  const text = sel?.focusNode?.textContent;
  if (!text || tagSet.value.has(text)) {
    return;
  }
  tagSet.value.add(text);
  const warpper = appendTag(text, sel.focusNode);
  const range = document.createRange();
  range.setStartAfter(warpper);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function appendTag(text: string, focusNode: Node) {
  const wrapper = document.createElement('span');
  wrapper.classList.add('tag-wrapper');
  wrapper.contentEditable = 'false';
  const tag = document.createElement('span');
  tag.classList.add('tag');
  tag.textContent = text;
  tag.contentEditable = 'false';
  const icon = document.createElement('img');
  icon.src = '/src/assets/svg-icons/icon-close.svg';
  icon.classList.add('close');
  icon.addEventListener('click', deleteTag);
  tag.appendChild(icon);
  wrapper.appendChild(tag);
  input.value.insertBefore(wrapper, focusNode);
  input.value.removeChild(focusNode);
  return wrapper;
}

function getWrapper(node: Node): HTMLSpanElement | undefined {
  let node_: any = node;
  while (node_) {
    if (node_ === input.value) {
      return;
    }
    if (node_ instanceof HTMLSpanElement && node_.classList.contains('tag-wrapper')) {
      return node_;
    }
    node_ = node_.parentElement;
  }
}

function onClick() {
  const sel = document.getSelection();
  if (!sel || !sel.anchorNode) {
    return;
  }
  const parent = getWrapper(sel.anchorNode);
  if (parent) {
    const range = document.createRange();
    range.setStartAfter(parent);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function onFocus() {
  showPlaceHolder.value = false;
}

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
  <div class="outer">
    <p v-if="showPlaceHolder" class="placeholder">{{ placeholder }}</p>
    <!-- <img src="@/assets/svg-icons/icon-add.svg" class="add-icon" @click="addTag"> -->
    <div class="input" ref="input" contenteditable="true" @focus="onFocus" @blur="onBlur" @keydown.enter="addTag" @click="onClick"></div>
  </div>
</template>

<style scoped lang="scss">
:deep(.tag-wrapper) {
  padding: 0 3px;
  white-space: nowrap;

  &:first-child {
    padding-left: 0;
  }

  .tag {
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