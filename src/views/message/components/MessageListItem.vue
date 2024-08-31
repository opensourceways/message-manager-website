<script setup lang="ts">
import { computed, h, inject, type Ref } from 'vue';
import { OBadge, OCheckbox } from '@opensig/opendesign';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';

import type { MessageT } from '@/@types/type-messages';
import WordAvatar from '@/components/WordAvatar.vue';
import IconLink from '@/components/IconLink.vue';
import { EventSources } from '@/data/event';
import { usePhoneStore } from '@/stores/phone';

defineEmits<{
  (event: 'deleteMessage'): void;
  (event: 'readMessage'): void;
}>();
const props = defineProps<{
  msg: MessageT;
}>();

const isPhone = inject<Ref<boolean>>('isPhone');

const checkboxes = inject<Ref<(string | number)[]>>('checkboxes');

const EXTRACT_REGEX = /(?:<a>(.*?)<\/a>)|(?:<sourceUrl>(.*?)<sourceUrl>)/;

const Title = (props: { msg: MessageT }) => {
  const matched = props.msg.summary.match(EXTRACT_REGEX);
  const extracted = matched && (matched[1] || matched[2]);
  const split = props.msg.summary.split(EXTRACT_REGEX);
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

const sourceGroupTitle = computed(() => {
  switch (props.msg.source_group) {
    case EventSources.EUR:
      return '项目';
    default:
      return '仓库';
  }
});

// ------------------------移动端------------------------
const phoneStore = usePhoneStore();
</script>

<template>
  <!-- 移动端 -->
  <div v-if="isPhone" class="phone-message-list-item">
    <OBadge :dot="true" v-if="!msg.is_read" color="danger">
      <WordAvatar :name="msg.user" size="small" />
    </OBadge>
    <WordAvatar v-else :name="msg.user" size="small" />
    <div class="msg-detail">
      <div>
        <p>{{ msg.user }}</p>
        <Title :msg="msg" />
        <p class="source-group">{{ sourceGroupTitle + msg.source_group }}</p>
      </div>
      <p class="time">{{ msg.formattedTime }}</p>
    </div>
    <OCheckbox v-if="phoneStore.isManaging" class="checkbox" :value="msg.id" v-model="checkboxes" />
  </div>

  <div v-else class="message-list-item">
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
      <p>{{ sourceGroupTitle + msg.source_group }}</p>
      <p>{{ msg.formattedTime }}</p>
      <div class="list-item-right-hover">
        <IconLink @click="$emit('deleteMessage')">
          <template #suffix><DeleteIcon /></template>
        </IconLink>
        <IconLink @click="$emit('readMessage')" :disabled="msg.is_read">
          <template #suffix><ReadIcon /></template>
        </IconLink>
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
    gap: 6px;
    @include tip1;

    .checkbox {
      transform: translateY(-14px);
    }

    & > div {
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
