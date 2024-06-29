<script setup lang="ts">
import { ref } from 'vue';
import TheRecipientConfig from './TheRecipientConfig.vue'
import TheSubscribeConfig from './TheSubscribeConfig.vue'
import { OTab, OTabPane } from '@opensig/opendesign';

const activeTab = ref('a');
</script>

<template>
  <header>
    <p class="title">{{ $t('config.subscribeConfig') }}</p>
  </header>

  <div class="tabs">
    <OTab v-model="activeTab">
      <OTabPane value="a" :label="$t('config.receiveConfig')">
        <TheSubscribeConfig />
      </OTabPane>
      <OTabPane value="b" :label="$t('config.receiverManagement')">
        <TheRecipientConfig />
      </OTabPane>
    </OTab>
  </div>
</template>

<style scoped lang="scss">
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