<script setup lang="ts">
import { ref, type Ref, onMounted, watch, computed, watchEffect } from 'vue';
import IconClose from '@/assets/svg-icons/icon-close.svg';
import { useMessage } from '@opensig/opendesign';

const props = withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    placeholder?: string;
    showAddButton?: boolean;
    tags?: string[];
    regExp?: RegExp;
  }>(),
  {
    placeholder: '',
    width: '300px',
    height: '126px',
  }
);

const message = useMessage();
const inputArea = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const tagSet = ref(new Set<string>());
const hasTags = computed(() => tagSet.value.size > 0);

const tagsRemovedObserver = new MutationObserver(([mut]) => {
  if (mut.removedNodes.length) {
    mut.removedNodes.forEach((node) => {
      if (node instanceof HTMLSpanElement && node.classList.contains('tag-wrapper')) {
        tagSet.value.delete(node.textContent as string);
      }
    });
  }
});

onMounted(() => tagsRemovedObserver.observe(inputArea.value, { childList: true }));
const focused = ref(false);
const showPlaceHolder = ref(true);

const onFocus = () => focused.value = true;

const onBlur = () => focused.value = false;

watchEffect(() => {
  if (focused.value || tagSet.value.size > 0) {
    showPlaceHolder.value = false;
  } else if (inputArea.value?.hasChildNodes()) {
    showPlaceHolder.value = false;
  } else {
    showPlaceHolder.value = true;
  }
});

watch(
  () => props.tags,
  (tags) => {
    if (tags && tags.length) {
      tagSet.value = new Set(tags);
      inputArea.value.innerHTML = '';
      tags.forEach((tag) => appendTag(tag));
    }
  }
);

const deleteTag = (event: MouseEvent) => {
  const tagWrapper = (event.target as HTMLImageElement).parentElement?.parentElement as HTMLSpanElement;
  inputArea.value.removeChild(tagWrapper);
};

const addTag = (event?: KeyboardEvent) => {
  if (event) {
    event.preventDefault();
  }
  const sel = window.getSelection();
  const text = sel?.focusNode?.textContent;
  if (!text || tagSet.value.has(text)) {
    return;
  }
  if (props.regExp && !props.regExp.test(text)) {
    message.warning({ content: '格式不正确' });
    return;
  }
  tagSet.value.add(text);
  const warpper = appendTag(text, sel.focusNode);
  const range = document.createRange();
  range.setStartAfter(warpper);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const appendTag = (text: string, focusNode?: Node) => {
  const wrapper = document.createElement('span');
  wrapper.classList.add('tag-wrapper');
  wrapper.contentEditable = 'false';

  const tag = document.createElement('span');
  tag.classList.add('tag');
  tag.textContent = text;
  tag.contentEditable = 'false';

  const icon = document.createElement('img');
  icon.src = IconClose;
  icon.classList.add('close');
  icon.addEventListener('click', deleteTag);
  tag.appendChild(icon);

  wrapper.appendChild(tag);
  if (focusNode) {
    inputArea.value.insertBefore(wrapper, focusNode);
    inputArea.value.removeChild(focusNode);
  } else {
    inputArea.value.appendChild(wrapper);
  }
  return wrapper;
};

const getWrapper = (node: Node): HTMLSpanElement | undefined => {
  let node_: Node | HTMLElement | null = node;
  while (node_) {
    if (node_ === inputArea.value) {
      return;
    }
    if (node_ instanceof HTMLSpanElement && node_.classList.contains('tag-wrapper')) {
      return node_;
    }
    node_ = node_.parentElement;
  }
};

const onClick = () => {
  const sel = document.getSelection();
  if (!sel || !sel.anchorNode) {
    return;
  }
  const tagWrapper = getWrapper(sel.anchorNode);
  if (tagWrapper) {
    const range = document.createRange();
    range.setStartAfter(tagWrapper);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

const getTagValues = () => [...tagSet.value];

const onClickPlaceholder = () => inputArea.value.focus();

const clear = () => {
  inputArea.value.innerHTML = '';
  tagSet.value.clear();
};

defineExpose({
  getTagValues,
  clear,
  hasTags
});
</script>

<template>
  <div class="outer" :style="{ width: width, minHeight: height }">
    <p v-if="showPlaceHolder" class="placeholder" @click="onClickPlaceholder">{{ placeholder }}</p>
    <div class="inputArea" ref="inputArea" contenteditable="true" @focus="onFocus" @blur="onBlur" @keydown.enter="addTag" @click="onClick"></div>
  </div>
</template>

<style scoped lang="scss">
:deep(.tag-wrapper) {
  padding: 0 3px;
  white-space: nowrap;

  .tag {
    padding: 3px 12px;
    padding-right: 32px;
    max-width: 100%;
    background-color: #dedee3;
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
  padding: 8px 16px;
  position: relative;
  display: flex;
  flex-direction: column;

  .inputArea {
    width: 100%;
    outline: none;
    flex-grow: 1;
  }

  .placeholder {
    position: absolute;
    font-size: var(--o-font_size-tip1);
    color: var(--o-color-info3);
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
