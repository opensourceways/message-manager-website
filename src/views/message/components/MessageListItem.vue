<script setup lang="ts">
import { h } from 'vue';
import { OBadge, ODivider, OIcon } from '@opensig/opendesign';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';

import type { MessageT } from '@/@types/type-messages';
import WordAvatar from '@/components/WordAvatar.vue'

defineEmits<{
  (event: 'deleteMessage', msg: MessageT): void;
  (event: 'readMessage', msg: MessageT): void;
}>();
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
</script>

<template>
  <div class="message-list-item" >
    <div class="list-item-left">
      <div class="user-info">
        <OBadge :dot="true" v-if="!msg.is_read" color="danger">
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
      <div class="list-item-right-hover">
        <OIcon @click="$emit('deleteMessage', msg)" class="icon"><DeleteIcon/></OIcon>
        <OIcon @click="$emit('readMessage', msg)" class="icon" v-if="!msg.is_read"><ReadIcon/></OIcon>
      </div>
    </div>

    <ODivider style="position: absolute; bottom: 0; transform: translateY(28px); width: 100%;"/>
  </div>
</template>

<style scoped lang="scss">
.msg-title {
  @include tip1;
  line-height: 22px;
}

:deep(.o-badge-dot) {
  --badge-dot-size: 6px;
}

.message-list-item {
  position: relative;
  margin-left: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;

  .list-item-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    @include tip1;
    line-height: 22px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .list-item-right {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    color: var(--o-color-info3);
    font-size: var(--o-font_size-tip2);
    line-height: var(--o-line_height-tip2);
  }

  .list-item-right-hover {
    display: none;
    align-items: center;
    justify-content: flex-end;
    position: absolute;
    right: 0;
    height: 100%;
    width: 100%;
    gap: 32px;
    padding-right: 22px;
    background-color: var(--o-color-control2-light);

    .icon {
      font-size: 24px;
      cursor: pointer;

      @include hover {
        color: rgb(var(--o-kleinblue-6));
      }
    }
  }

  @include hover {
    .list-item-right-hover {
      display: flex;
    }
  }
}
</style>