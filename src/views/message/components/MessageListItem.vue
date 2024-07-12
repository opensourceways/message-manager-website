<script setup lang="ts">
import type { MessageT } from '@/@types/type-messages';
import HorizontalLine from '@/components/HorizontalLine.vue';
import WordAvatar from '@/components/WordAvatar.vue'
import { OBadge } from '@opensig/opendesign';
import { h } from 'vue';

defineProps<{
  msg: MessageT;
  onHover?: boolean;
}>();

const EXTRACT_REGEX = /<sourceUrl>(.*?)<sourceUrl>/;

const Title = (props: { msg: MessageT }) => {
  const matched = props.msg.title.match(EXTRACT_REGEX);
  const extracted = matched && matched[1];
  const split = props.msg.title.split(EXTRACT_REGEX);
  let replaceIndex: number;
  if (extracted) {
    replaceIndex = split.findIndex((item) => item === extracted);
  }
  const title = split.map((item, index) => {
    if (index === replaceIndex) {
      return h('a', {
        href: props.msg.source_url,
        target: '_blank',
        style: 'color: #002EA7',
      }, ' ' + item);
    }
    return item;
  });
  return h('p', {
    class: 'msg-title',
    unread: !props.msg.is_read,
  }, title);
};
</script>

<template>
  <div class="message-list-item">
    <div class="list-item-left">
      <div class="user-info">
        <OBadge v-if="!msg.is_read" color="danger">
          <WordAvatar :name="msg.user" size="small" />
        </OBadge>
        <WordAvatar v-else :name="msg.user" size="small" />
        <span>{{ msg.user }}</span>
      </div>
      <Title :msg="msg" />
    </div>
    <div class="list-item-right">
      <p>仓库{{ msg.source_group }}</p>
      <p>{{ msg.formattedTime }}</p>
    </div>

    <HorizontalLine style="position: absolute; bottom: 0; transform: translateY(16px); width: 100%;" />
  </div>
</template>

<style scoped lang="scss">
.msg-title {
  font-size: 14px;
  line-height: 22px;
}

.message-list-item {
  position: relative;
  margin-left: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;

  .list-item-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    line-height: 22px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .list-item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    color: rgba(0, 0, 0, 0.6);
    font-size: var(--o-font_size-tip2);
    line-height: var(--o-line_height-tip2);
  }

  .list-item-right-hover {
    display: flex;
    gap: 32px;
    padding-right: 22px;
  }
}
</style>