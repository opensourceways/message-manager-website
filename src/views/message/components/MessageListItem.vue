<script setup lang="ts">
import { computed, h, inject, type Ref } from 'vue';
import { OBadge, OCheckbox, OIcon } from '@opensig/opendesign';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';

import type { MessageT } from '@/@types/type-messages';
import WordAvatar from '@/components/WordAvatar.vue';
import { EventSources } from '@/data/event';

const emit = defineEmits<{
  (event: 'deleteMessage', msg: MessageT): void;
  (event: 'readMessage', msg: MessageT): void;
}>();
const props = defineProps<{
  msg: MessageT;
}>();

const checkboxVal = inject<Ref<(string | number)[]>>('checkboxVal');

const EXTRACT_REGEX = /<a href=".+">(.*?)<\/a>/;
const LINE_BR = /[\r\n]/g;

const Title = (props: { msg: MessageT }) => {
  const summary = props.msg.summary.replace(LINE_BR, '');
  const matched = summary.match(EXTRACT_REGEX);
  const extracted = matched && matched[1];
  const split = summary.split(EXTRACT_REGEX);
  let replaceIndex: number;
  if (extracted) {
    replaceIndex = split.findIndex((item) => item === extracted);
  }
  const title = split.map((item, index) => {
    if (index === replaceIndex) {
      return h(
        'a',
        {
          onClick: () => emit('readMessage', { ...props.msg }),
          href: props.msg.source_url,
          target: '_blank',
        },
        ' ' + item
      );
    }
    return item;
  });
  return h(
    'p',
    {
      class: 'msg-title',
      unread: !props.msg.is_read,
      style: { fontWeight: props.msg.is_read ? 'normal' : 'bold' }
    },
    title
  );
};

const sourceGroupTitle = computed(() => {
  switch (props.msg.source_group) {
    case EventSources.EUR:
      return '项目';
    case EventSources.CVE:
      return 'SIG组';
    default:
      return '仓库';
  }
});
</script>

<template>
  <div class="message-list-item">
    <div class="list-item-left">
      <OCheckbox class="checkbox" :value="msg.id" v-model="checkboxVal" />
      <div>
        <p class="user-info">
          <OBadge :dot="true" v-if="!msg.is_read" color="danger">
            <WordAvatar :name="msg.user" size="small" />
          </OBadge>
          <WordAvatar v-else :name="msg.user" size="small" />
          <span :style="{ fontWeight: msg.is_read ? 'normal' : 'bold' }">{{ msg.user }}</span>
        </p>
        <Title :msg="msg" />
      </div>
    </div>
    <div class="list-item-right">
      <p>{{ sourceGroupTitle + msg.source_group }}</p>
      <p>{{ msg.formattedTime }}</p>
      <div class="list-item-right-hover">
        <OIcon :class="['read-icon', msg.is_read ? 'disabled' : '']" @click="$emit('readMessage', { ...msg })" :disabled="msg.is_read" title="标记已读">
          <ReadIcon />
        </OIcon>
        <OIcon class="del-icon" @click="$emit('deleteMessage', { ...msg })" hover-color="var(--o-color-danger1)" title="删除">
          <DeleteIcon />
        </OIcon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.msg-title {
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-height: 44px;

  @include respond-to('phone') {
    white-space: inherit;
  }
}

:deep(.o-badge-dot) {
  --badge-dot-size: 6px;
}

.phone-message-list-item {
  display: flex;
  align-items: center;
  
  .msg-detail {
    flex-grow: 1;
    display: flex;
    margin-left: 16px;
    width: calc(100% - 66px);

    .source-group {
      @include text1;
      color: var(--o-color-info3);
    }

    .time {
      white-space: nowrap;
    }

    span {
      font-size: 12px;
    }
  }

  :deep(.o-checkbox-wrap) {
    flex-direction: row-reverse;
  }
}

.message-list-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;

  .list-item-left {
    width: 0;
    flex: 1;
    margin-right: 124px;
    display: flex;
    @include tip1;

    .checkbox {
      transform: translateY(-14px);
      --checkbox-label-gap: 0;
    }

    & > div {
      margin-left: 28px;
      display: flex;
      width: 0;
      flex: 1;
      flex-direction: column;
      gap: 6px;

      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        width: fit-content;
      }
    }
  }

  .list-item-right {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    color: var(--o-color-info3);
    @include tip2;
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
    background-color: rgb(var(--o-kleinblue-1));

    @mixin icon {
      font-size: 24px;
      cursor: pointer;
    }

    .read-icon {
      @include icon;
      @include hover {
        color: var(--o-color-primary1);
      }
    }

    .disabled {
      cursor: not-allowed;
      @include hover {
        color: var(--icon-btn-color-disabled);
      }
    }

    .del-icon {
      @include icon;
      @include hover {
        color: var(--o-color-danger1);
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
