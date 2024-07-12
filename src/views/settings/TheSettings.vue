<script setup lang="ts">
import { computed, ref } from 'vue';
import { OButton, OTab, OTabPane } from '@opensig/opendesign';
import SettingsRecipient from './SettingsRecipient.vue';
import SettingsSubscribe from './SettingsSubscribe.vue';

const activeTab = ref('a');
const subConfig = ref<any>();
const btnsDisabled = computed(() => subConfig.value && subConfig.value.btnsDisabled);

function addRecipient() {
  subConfig.value.handleExternalAddRecipient();
}

function removeRecipient() {
  subConfig.value.removeRecipient();
}
</script>

<template>
  <div class="page-body">
    <header>
      <p class="title">{{ $t('config.subscribeConfig') }}</p>
    </header>

    <div class="tabs">
      <OTab v-model="activeTab" :line="false">
        <template #suffix>
          <div v-if="activeTab === 'a'" class="subs-config-btn-group">
            <OButton variant="outline" round="pill" :disabled="btnsDisabled" :color="'primary'" @click="addRecipient">添加接收人</OButton>
            <OButton variant="outline" round="pill" :disabled="btnsDisabled" :color="'primary'" @click="removeRecipient">移除接收人</OButton>
          </div>
        </template>
        <OTabPane value="a" :label="$t('config.receiveConfig')">
          <SettingsSubscribe ref="subConfig" />
        </OTabPane>
        <OTabPane value="b" :label="$t('config.receiverManagement')">
          <SettingsRecipient />
        </OTabPane>
      </OTab>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subs-config-btn-group {
  display: flex;
  gap: 24px;
}

.tabs {
  --tab-nav-justify: left;
  margin-top: 23px;
}

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
}

.title {
  font-size: 40px;
  font-weight: medium;
}
</style>
