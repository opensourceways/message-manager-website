<script setup lang="ts">
import { ref } from 'vue';
import TheRecipientConfig from './TheRecipientConfig.vue'
import { OTab, OTabPane } from '@opensig/opendesign';

const activeTab = ref('a');
</script>

<template>
  <div class="page-body">
    <header>
      <p class="title">{{ $t('config.subscribeConfig') }}</p>
    </header>

    <OTab v-model="activeTab" style="margin-top: 23px;">
      <OTabPane value="a" :label="$t('config.receiveConfig')">
      </OTabPane>
      <OTabPane value="b" :label="$t('config.receiverManagement')">
        <TheRecipientConfig />
      </OTabPane>
    </OTab>

  </div>
</template>

<style scoped lang="scss">
$default-page-body-width: 1416px;
$default-page-body-height: 900px;

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

.page-body {
  --tab-nav-justify: left;
  width: $default-page-body-width;
  height: $default-page-body-height;
  background-color: #FFF;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  padding: calc($default-page-body-height * 0.04) calc($default-page-body-width * 0.02);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: calc($default-page-body-height * 0.02);
  }

  .title {
    font-size: 40px;
    font-weight: medium;
  }
}
</style>