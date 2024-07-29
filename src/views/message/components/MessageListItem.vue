<script setup lang="ts">
import { h, inject, type Ref } from 'vue';
import { OBadge, OCheckbox } from '@opensig/opendesign';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';

import type { MessageT } from '@/@types/type-messages';
import WordAvatar from '@/components/WordAvatar.vue';
import IconLink from '@/components/IconLink.vue';

const emits = defineEmits<{
  (event: 'deleteMessage', msg: MessageT): void;
  (event: 'readMessage', msg: MessageT): void;
}>();
const props = defineProps<{
  msg: MessageT;
}>();

const checkboxes = inject<Ref<(string | number)[]>>('checkboxes');

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
      return h(
        'a',
        {
          href: props.msg.source_url,
          target: '_blank',
          style: 'color: #002EA7',
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
    },
    title
  );
};

const onClickRead = () => {
  if (!props.msg.is_read) {
    return;
  }
  emits('readMessage', props.msg);
};
</script>

<template>
  <div class="message-list-item">
    <div class="list-item-left">
      <OCheckbox class="checkbox" :value="msg.id" v-model="checkboxes" />
      <div>
        <p class="user-info">
          <OBadge :dot="true" v-if="!msg.is_read" color="danger">
            <WordAvatar :name="msg.user" size="small" />
          </OBadge>
          <WordAvatar v-else :name="msg.user" size="small" />
          <span>{{ msg.user }}</span>
        </p>
        <Title :msg="msg" />
      </div>
    </div>
    <div class="list-item-right">
      <p>仓库{{ msg.source_group }}</p>
      <p>{{ msg.formattedTime }}</p>
      <div class="list-item-right-hover">
        <IconLink @click="$emit('deleteMessage', msg)">
          <template #suffix><DeleteIcon /></template>
        </IconLink>
        <IconLink @click="onClickRead" :disabled="msg.is_read">
          <template #suffix><ReadIcon /></template>
        </IconLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.msg-title {
  @include tip1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.o-badge-dot) {
  --badge-dot-size: 6px;
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
    gap: 6px;
    @include tip1;

    .checkbox {
      transform: translateY(-14px);
    }

    div {
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

    .icon {
      font-size: 24px;
      cursor: pointer;

      @include hover {
        color: rgb(var(--o-kleinblue-6));
      }
    }

    .disabled {
      font-size: 24px;
      cursor: not-allowed;
    }
  }

  @include hover {
    .list-item-right-hover {
      display: flex;
    }
  }
}
</style>
