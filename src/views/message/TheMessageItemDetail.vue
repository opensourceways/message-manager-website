<script setup lang="ts">
import type { MessageT } from "@/@types/type-messages";
import { h } from "vue";

defineProps<{
  msg: MessageT;
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

const SOURCES: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR',
  'https://gitee.com': 'Gitee',
};
const EVENT_TYPES: Record<string, string> = {
  'build': '构建',
  'issue': 'Issue',
  'push': 'Push',
  'pr': 'Pull Request',
  'note': '评论',
};
</script>

<template>
  <div class="detail">
    <div class="left">
      <Title :msg="msg" />
      <p>
        {{ msg.source === 'https://gitee.com' ? '项目' : '构建' }}
        {{ msg.source_group }}
      </p>
    </div>
    <div class="right">
      <p>{{ msg.formattedTime }}</p>
      <p>{{ SOURCES[msg.source as string] }} | {{ EVENT_TYPES[msg.type as string] }}动态</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.msg-title {
  font-size: 14px;
  font-weight: normal;

  &[unread="true"] {
    font-weight: bold;
  }
}

.detail {
  margin-left: 16px;
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-grow: 1;
  
  p {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
}
</style>