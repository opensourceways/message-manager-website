<script setup lang="ts">
import { OCheckbox, OLink } from '@opensig/opendesign';

import { EventSourceNames, EventTypeNames } from '@/data/subscribeSettings';
import type { SubscribeRuleT } from '@/@types/type-settings';
import { updateNeedStatus } from '@/api/api-settings';

const emit = defineEmits<{
  (event: 'editOrAddRule', type: 'add' | 'edit', source: string, eventType: string, rule?: SubscribeRuleT): void;
  (event: 'deleteRule', rule: Pick<SubscribeRuleT, 'mode_name' | 'source' | 'event_type'>): void;
}>();
const props = defineProps<{
  source: string;
  eventTypes: Record<string, SubscribeRuleT[]>;
}>();

const addRule = (eventType: string) => {
  emit('editOrAddRule', 'add', props.source, eventType);
};

const editRule = (eventType: string, rule: SubscribeRuleT) => {
  emit('editOrAddRule', 'edit', props.source, eventType, rule);
};

const needCheckboxChange = (rule: SubscribeRuleT) => {
  updateNeedStatus(rule);
};
</script>

<template>
  <div class="o-table">
    <div class="o-table-wrap">
      <table>
        <thead>
          <tr class="head-row">
            <th>{{ EventSourceNames[source] }}</th>
            <th>站内消息</th>
            <th>邮箱</th>
            <th>短信</th>
            <th class="disabled-th">电话</th>
            <th class="disabled-th">API钩子</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-for="(rules, type, index) in eventTypes" :key="type">
          <tr v-if="index !== 0" class="empty-row">
            <td colspan="10"></td>
          </tr>
          <tr class="event-type" v-if="Object.keys(eventTypes).length > 1">
            <td colspan="7">{{ EventTypeNames[source][type] }}</td>
          </tr>
          <tr class="business-row" v-for="rule in rules" :key="rule.mode_name">
            <td>{{ rule.mode_name || '全部消息（默认）' }}</td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_inner_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_mail" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td class="actions-cell">
              <p class="actions">
                <template v-if="rule.mode_name">
                  <OLink color="primary" @click="editRule(type, rule)">修改规则</OLink>
                  <OLink color="danger" @click="$emit('deleteRule', rule)">删除</OLink>
                </template>
              </p>
            </td>
          </tr>
          <tr class="last-row">
            <td colspan="7">
              <OLink color="primary" @click="addRule(type)">创建消息接收规则</OLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.o-table {
  --table-head-bg: rgb(var(--o-kleinblue-2));
  --table-radius: 4px;
  --table-row-hover: transparent;

  & .business-row {
    @include hover {
      background-color: var(--o-color-control2-light);
    }
  }
}

th,
td {
  @include tip1;
  padding-right: 0;
  padding-left: 0;
}

@mixin append-before-after {
  &::before {
    content: '';
    display: table-cell;
    width: 48px;
    @content;
  }

  &::after {
    content: '';
    display: table-cell;
    width: 40px;
    @content;
  }
}

.empty-row {
  td {
    background-color: var(--o-color-fill1);
    height: 8px;
    padding: 0;
  }
}

tr {
  &:not(.empty-row) {
    @include append-before-after;
  }
}

.business-row {
  td {
    border-bottom: 1px solid var(--o-color-control1-light);

    &:first-child {
      width: 392px;
    }

    &:nth-child(2) {
      width: 144px;
    }

    &:nth-child(3) {
      width: 112px;
    }

    &:nth-child(4) {
      width: 112px;
    }

    &:nth-child(5) {
      width: 112px;
    }

    &:nth-child(6) {
      width: 316px;
    }
  }

  .actions-cell {
    .actions {
      display: flex;
      gap: 32px;
      align-items: center;
      white-space: nowrap;
    }
  }
}

.head-row {
  @include append-before-after {
    background-color: var(--table-head-bg);
  }

  .disabled-th {
    color: var(--o-color-info4);
  }
}
</style>
