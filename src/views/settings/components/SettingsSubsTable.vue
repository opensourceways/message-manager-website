<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { useCheckbox } from '@/composables/useCheckbox';
import { OCheckbox, OLink } from '@opensig/opendesign';
import { eventSourceNames, eventTypeNames } from '@/data/subscribeSettings';
import type { SubscribeRuleT } from '@/@types/type-settings';
import { updateNeedStatus } from '@/api/api-settings';

const emit = defineEmits<{
  (event: 'editRecipients', rule: SubscribeRuleT): void;
  (event: 'checkboxChange'): void;
  (event: 'deleteRule', rule: Pick<SubscribeRuleT, 'mode_name' | 'source' | 'event_type'>): void;
}>();
const props = defineProps<{
  source: string;
  eventTypes: Record<string, SubscribeRuleT[]>;
}>();

const editOrAddFn = inject<(dlgType: 'edit' | 'add', source: string, eventType: string, subscribe?: SubscribeRuleT) => void>('onEditOrAdd', () => {});

const checkboxDataSource = computed(() => Object.values(props.eventTypes).flat());

const { checkboxes, parentCheckbox, indeterminate } = useCheckbox(checkboxDataSource, (item) => item.id);

watch(checkboxes, () => emit('checkboxChange'));

const addRule = (eventType: string) => {
  editOrAddFn('add', props.source, eventType);
};

const editRule = (eventType: string, subs: SubscribeRuleT) => {
  editOrAddFn('edit', props.source, eventType, subs);
};

/**
 * 获取被勾选的消息接收规则
 */
const getCheckedRules = () => {
  const set = new Set(checkboxes.value);
  return checkboxDataSource.value.filter((item) => set.has(item.id));
};

/**
 * 获取勾选状态的checkbox的数量
 */
const getCheckedRulesCount = () => {
  return checkboxes.value.length;
};

const needCheckboxChange = (rule: SubscribeRuleT) => {
  updateNeedStatus(rule)
}

defineExpose({
  getCheckedRules,
  getCheckedRulesCount
});
</script>

<template>
  <div class="o-table">
    <div class="o-table-wrap">
      <table>
        <thead>
          <tr class="head-row">
            <th class="checkbox-cell">
              <OCheckbox :value="1" v-model="parentCheckbox" :indeterminate="indeterminate" />
            </th>
            <th class="first-cell">{{ eventSourceNames[source] }}</th>
            <th>站内消息</th>
            <th>邮箱</th>
            <th>短信</th>
            <th class="disabled-th">电话</th>
            <th class="disabled-th">API钩子</th>
            <th>消息接收人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-for="(rules, type, index) in eventTypes" :key="type">
          <tr v-if="index !== 0">
            <td colspan="10" class="last-row"></td>
          </tr>
          <tr v-if="Object.keys(eventTypes).length > 1">
            <td colspan="9" class="mode-name-cell">{{ eventTypeNames[source][type] }}</td>
          </tr>
          <tr class="business-row" v-for="rule in rules" :key="rule.mode_name">
            <td class="checkbox-cell">
              <OCheckbox :value="rule.id" v-model="checkboxes" />
            </td>
            <td class="first-cell">{{ rule.mode_name || '全部消息（默认）' }}</td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_inner_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_mail" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox @change="needCheckboxChange(rule)" value="need_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td class="recipient-names-cell">
              <p class="recipient-names">
                {{ rule.displayRecipientNames }}
              </p>
            </td>
            <td class="actions-cell">
              <p class="actions">
                <OLink color="primary" @click="$emit('editRecipients', rule)">修改接收人</OLink>
                <template v-if="rule.mode_name">
                  <OLink color="primary" @click="editRule(type, rule)">修改规则</OLink>
                  <OLink color="danger" @click="$emit('deleteRule', rule)">删除</OLink>
                </template>
              </p>
            </td>
          </tr>
          <tr>
            <td />
            <td colspan="9" class="first-cell">
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

th, td {
  @include tip1;
  padding-left: 0;
}

.mode-name-cell {
  padding-left: 44px;
}

.first-cell {
  padding-left: 0;
  word-break: break-all;
  
  @include respond-to('>laptop') {
    width: 208px;
  }

  @include respond-to('<=laptop') {
    width: 160px;
  }
}

@mixin append-last {
  &::after {
    content: '';
    display: table-cell;
    width: 40px;
    @content;
  }
}

.checkbox-cell {
  padding-left: 44px;
  padding-right: 0;
  width: var(--o-control_size-s);
}

.business-row {
  td {
    &:not(.checkbox-cell) {
      border-bottom: 1px solid var(--o-color-control1-light);
    }

    &:last-child {
      padding-right: 0;
    }
  }

  .recipient-names-cell {
    @include respond-to('>laptop') {
      width: 300px;
    }

    @include respond-to('<=laptop') {
      width: 250px;
    }

    .recipient-names {
      width: 90%;
      word-break: break-all;
    }
  }

  .actions-cell {
    padding-left: 0;
    padding-right: 0;
    width: 240px;

    .actions {
      display: flex;
      gap: 32px;
      align-items: center;
    }
  }

  @include append-last;
}

.head-row {
  @include append-last {
    background-color: var(--table-head-bg);
  }

  .disabled-th {
    color: var(--o-color-info4);
  }
}

.last-row {
  background-color: var(--o-color-fill1);
  height: 8px;
  padding: 0;
}
</style>
