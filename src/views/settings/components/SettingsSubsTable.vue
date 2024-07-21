<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { useCheckbox } from '@/composables/useCheckbox';
import { OCheckbox, OLink } from '@opensig/opendesign';
import { eventSourceNames, eventTypeNames } from '@/data/subscribeSettings';
import type { SubscribeRuleT } from '@/@types/type-settings';

const emit = defineEmits<{
  (event: 'addRule', source: string, type: string): void;
  (event: 'editRule', source: string, type: string, modeName: string, modeFilter: { repo_name: string; is_bot: boolean }): void;
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
            <th>电话</th>
            <th>API钩子</th>
            <th>消息接收人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-for="(rules, type, index) in eventTypes" :key="type">
          <tr v-if="index !== 0">
            <td colspan="10" class="last-row"></td>
          </tr>
          <tr>
            <td colspan="9">{{ eventTypeNames[source][type] }}</td>
          </tr>
          <tr class="service-row" v-for="rule in rules" :key="rule.mode_name">
            <td class="checkbox-cell">
              <OCheckbox :value="rule.id" v-model="checkboxes" />
            </td>
            <td class="first-cell">
              {{ rule.mode_name || '全部消息（默认）' }}
            </td>
            <td><OCheckbox value="need_inner_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox value="need_mail" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox value="need_message" v-model="rule.needCheckboxes" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td><OCheckbox :value="1" :disabled="true" /></td>
            <td>
              <p class="recipient-names">
                {{ rule.displayRecipientNames }}
              </p>
            </td>
            <td>
              <p class="actions">
                <OLink color="primary" @click="$emit('editRecipients', rule)">修改接收人</OLink>
                <template v-if="rule.mode_name">
                  <OLink color="primary" @click="editRule(type, rule)">修改规则</OLink>
                  <OLink color="danger">删除</OLink>
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
}

th, td {
  @include tip1;
}

@mixin append-last {
  &::after {
    content: '';
    display: table-cell;
    width: 20px;
    @content;
  }
}

.service-row {
  td {
    &:not(.checkbox-cell) {
      border-bottom: 1px solid var(--o-color-control1-light);
    }

    &:last-child {
      padding-right: 0;
    }
  }

  .checkbox-cell {
    padding-right: 0;
    width: var(--o-control_size-s);
  }

  .recipient-names {
    max-width: 180px;
    word-break: break-all;
  }

  .actions {
    display: flex;
    gap: 32px;
    align-items: center;
  }

  @include append-last;
}

.head-row {
  @include append-last {
    background-color: var(--table-head-bg);
  }
}

.first-cell {
  padding-left: 0;
}

.last-row {
  background-color: var(--o-color-fill1);
  height: 8px;
  padding: 0;
}
</style>
