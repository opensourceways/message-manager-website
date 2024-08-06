<script setup lang="ts">
import ToggleGroup from '@/components/ToggleGroup.vue';
import { EventSourceNames, EventSources, EventTypeNames } from '@/data/subscribeSettings';
import { OButton, ODialog, ODivider } from '@opensig/opendesign';
import { computed, ref } from 'vue';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'confirm', source: string, type: string): void
  (event: 'cancel'): void
}>();

const evSources = Object.values(EventSources).map(source => ({ label: EventSourceNames[source], value: source }));

const evTypes = computed(() => {
  if (!source.value) {
    return [];
  }
  return Object.entries(EventTypeNames[source.value]).map(([prop, val]) => {
    return { label: val, value: prop };
  });
});

const source = ref<string>('');
const type = ref<string>('');

const reset = () => {
  source.value = '';
  type.value = '';
};

const confirm = () => {
  emit('confirm', source.value, type.value);
  emit('update:visible', false);
};
</script>

<template>
  <ODialog :visible="visible" size="small" @change="$emit('update:visible', $event)">
    <template #header>筛选</template>
    <div class="msg-list-filter-dlg-content">
      <p>消息来源</p>
      <ToggleGroup v-model="source" :options="evSources"></ToggleGroup>
      <ODivider class="divider-line" :darker="true" />
      <p>消息类型</p>
      <ToggleGroup v-model="type" :options="evTypes"></ToggleGroup>
    </div>
    <template #footer>
      <div class="msg-list-filter-dlg-footer">
        <OButton variant="text" @click="reset">重置</OButton>
        <ODivider direction="v" style="height: 24px;" :darker="true" />
        <OButton variant="text" color="primary" @click="confirm">确定</OButton>
      </div>
    </template>
  </ODialog>
</template>

<style scoped lang="scss">
.msg-list-filter-dlg-footer {
  display: flex;
  justify-content: space-evenly;
}

.msg-list-filter-dlg-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .title {
    font-size: 14px;
  }
}

.divider-line {
  --o-divider-gap: 0;
}
</style>