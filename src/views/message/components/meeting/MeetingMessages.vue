<script setup lang="ts">
import type { MeetingSummary, MessageT } from '@/@types/type-messages';
import { ODivider } from '@opensig/opendesign';
import { computed } from 'vue';

const props = defineProps<{
  messages: MessageT[];
}>();

const NOW = new Date();

const summaries = computed(() => {
  try {
    return props.messages.map((item) => {
      const res = JSON.parse(item.summary) as MeetingSummary;
      res.deprecated = NOW > new Date(`${res.Date}T${res.Start}:00`);
      return res;
    });
  } catch {
    return [];
  }
});
</script>

<template>
  <div class="meeting-messages">
    <div class="meeting-card" v-for="summary in summaries" :key="summary.Mid">
      <div class="card-header">
        <div class="title">
          <p>{{ summary.Topic }}</p>
          <div :class="[summary.deprecated ? 'tag-deprecated' : 'tag']">{{ summary.deprecated ? '已过期' : '待参加' }}</div>
        </div>
        <div class="extra-info">
          <p>{{ summary.Date }}</p>
          <ODivider direction="v" />
          <p>{{ summary.Start }}-{{ summary.End }}</p>
          <ODivider direction="v" />
          <p>{{ summary.GroupName }}</p>
        </div>
      </div>
      <div class="detail">
        <template v-if="summary.Agenda">
          <span>会议详情</span>
          <span>{{ summary.Agenda }}</span>
        </template>
        <template v-if="summary.Sponsor">
          <span>发起人</span>
          <span>{{ summary.Sponsor }}</span>
        </template>
        <template v-if="summary.Mplatform">
          <span>会议平台</span>
          <span>{{ summary.Mplatform }}</span>
        </template>
        <template v-if="summary.Mid">
          <span>会议ID</span>
          <span>{{ summary.Mid }}</span>
        </template>
        <template v-if="summary.JoinUrl">
          <span>会议链接</span>
          <a class="link" :href="summary.JoinUrl" target="_blank" rel="noreferrer noopener">{{ summary.JoinUrl }}</a>
        </template>
        <template v-if="summary.Etherpad">
          <span>Etherpad链接</span>
          <a class="link" :href="summary.Etherpad" target="_blank" rel="noreferrer noopener">{{ summary.Etherpad }}</a>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.meeting-messages {
  margin-top: 24px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
  row-gap: 32px;

  .meeting-card {
    border-radius: 4px;
    border: 1px solid var(--o-color-control4);
    height: 294px;
    background-color: rgba(235, 241, 250, 0.4);

    html[data-o-theme='dark'] & {
      background-color: var(--o-color-fill3);
    }

    .card-header {
      padding: 16px 24px;
      background-color: var(--o-color-fill2);
      .title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        @include text2;
        font-weight: 500;

        p {
          max-width: 480px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @mixin tag-default {
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 24px;
          padding: 3px 12px;
          @include tip2;
          color: var(--o-color-white);
        }

        .tag {
          @include tag-default;
          background-color: rgb(var(--o-kleinblue-6));
        }

        .tag-deprecated {
          @include tag-default;
          background-color: var(--o-color-control1);
        }
      }

      .extra-info {
        margin-top: 14px;
        display: flex;
        align-items: center;
        @include tip1;
        color: var(--o-color-info3);
      }
    }

    .detail {
      @include tip2;
      color: var(--o-color-info3);
      display: grid;
      grid-template-columns: 80px 1fr;
      column-gap: 32px;
      row-gap: 4px;
      padding: 16px 0;
      margin-left: 24px;
      margin-right: 24px;

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      a {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
