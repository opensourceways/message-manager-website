<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';
import { OBadge, OCheckbox, ODivider, OIcon, OLink } from '@opensig/opendesign';
import WordAvatar from '@/components/WordAvatar.vue';

import type { MessageT } from '@/@types/type-messages';
import { EventSources } from '@/data/event';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';
import { windowOpen } from '@/utils/common';
import { useVModel } from '@vueuse/core';

const props = defineProps({
  messages: {
    type: Array as PropType<MessageT[]>,
    default: () => [],
  },
  checkboxes: {
    type: Array as PropType<(string | number)[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (event: 'update:checkboxes', val: (string | number)[]): void;
  (event: 'readMessage', msg: MessageT): void;
  (event: 'deleteMessage', msg: MessageT): void;
}>();

const LINE_BR = /[\r\n]/g;
const div = document.createElement('div');
const sourceGroupTitleMap = {
  [EventSources.EUR]: '项目',
  [EventSources.CVE]: 'SIG组',
};

const actualMessages = computed(() => {
  return props.messages.map((msg) => {
    msg.summary = msg.summary.replace(LINE_BR, '');
    div.innerHTML = msg.summary;
    return {
      ...msg,
      source_group: (sourceGroupTitleMap[msg.source] || '仓库') + msg.source_group,
      time: dayjs(msg.time).fromNow(),
      summary: div.textContent as string,
    };
  });
});

const checkboxVal = useVModel(props, 'checkboxes', emit);
const clearCheckboxes = () => (checkboxVal.value = []);
const checkAll = () => (checkboxVal.value = actualMessages.value.map((item) => item.id));

const jumpToLink = (msg: MessageT) => {
  emit('readMessage', msg);
  windowOpen(msg.source_url);
};

defineExpose({
  clearCheckboxes,
  checkAll,
});
</script>

<template>
  <div class="the-list">
    <div v-for="(msg, index) in actualMessages" :key="msg.id" class="message-list-item">
      <div class="list-item-left">
        <OCheckbox class="checkbox" :value="msg.event_id" v-model="checkboxVal" />
        <div>
          <p class="user-info">
            <OBadge :dot="true" v-if="!msg.is_read" color="danger">
              <WordAvatar :name="msg.user" size="small" />
            </OBadge>
            <WordAvatar v-else :name="msg.user" size="small" />
            <span :style="{ fontWeight: msg.is_read ? 'normal' : 'bold' }">{{ msg.user }}</span>
          </p>
          <OLink class="link" @click="jumpToLink(msg)" color="primary" :style="{ fontWeight: msg.is_read ? 'normal' : 'bold' }">{{
            msg.summary
          }}</OLink>
        </div>
      </div>
      <div class="list-item-right">
        <p>{{ msg.source_group }}</p>
        <p>{{ msg.time }}</p>
        <div class="list-item-right-hover">
          <OIcon :class="['read-icon', msg.is_read ? 'disabled' : '']" @click="$emit('readMessage', { ...msg })" :disabled="msg.is_read" title="标记已读">
            <ReadIcon />
          </OIcon>
          <OIcon class="del-icon" @click="$emit('deleteMessage', { ...msg })" hover-color="var(--o-color-danger1)" title="删除">
            <DeleteIcon />
          </OIcon>
        </div>
      </div>
      <ODivider v-if="index < actualMessages.length - 1" class="divider-line" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.the-list {
  :deep(.o-badge-dot) {
    --badge-dot-size: 6px;
  }

  .message-list-item {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 70px;
    border-radius: 4px;
    padding-left: 12px;
    margin-top: 4px;

    @include respond-to('phone') {
      height: auto;
      padding: 16px 0;
    }

    .link {
      display: block;
      font-size: 14px;
      line-height: 22px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-height: 44px;
      --link-color-hover: var(--o-color-link2);
    }

    .divider-line {
      position: absolute;
      bottom: 0;
      transform: translateY(2px);
      --o-divider-gap: 0;
      width: calc(100% - 56px);
      left: 56px;
    }

    @include hover {
      background-color: rgb(var(--o-kleinblue-1));
    }

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
}
</style>
