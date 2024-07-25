<script setup lang="ts">
import { computed, ref } from 'vue';
import { OIcon, OPopover, OTab, OTabPane } from '@opensig/opendesign';
import TipIcon from '~icons/app/icon-tip.svg';
import SettingsRecipient from './SettingsRecipient.vue';
import SettingsSubscribe from './SettingsSubscribe.vue';
import AppButton from '@/components/AppButton.vue';
import SettingsBreadcrumbs from './components/SettingsBreadcrumbs.vue';

const activeTab = ref(0);
const subscribeSettings = ref<InstanceType<typeof SettingsSubscribe>>();
const recipientSettings = ref<InstanceType<typeof SettingsRecipient>>();
const components = [subscribeSettings, recipientSettings];
const currentComponent = computed(() => components[activeTab.value].value);
const btnsDisabled = computed(() => subscribeSettings.value?.btnDisabled);
const tipRef = ref();

const addRecipient = () => {
  currentComponent.value?.addRecipient();
};

const removeRecipient = () => {
  subscribeSettings.value?.removeRecipient();
};
</script>

<template>
  <div class="page-body">
    <SettingsBreadcrumbs />
    <header>
      {{ $t('config.subscribeConfig') }}
    </header>
    <div class="tabs">
      <OTab v-model="activeTab" :line="false">
        <template #suffix>
          <div v-if="activeTab === 0" class="subs-config-btn-group">
            <AppButton variant="outline" round="pill" :disabled="btnsDisabled" @click="addRecipient">添加接收人</AppButton>
            <AppButton variant="outline" round="pill" :disabled="btnsDisabled" @click="removeRecipient">移除接收人</AppButton>
          </div>
          <div v-if="activeTab === 1" style="display: flex; gap: 8px; align-items: center">
            <AppButton variant="outline" round="pill" @click="addRecipient">新增接收人</AppButton>
            <OPopover :target="tipRef">
              <p class="tips">
                新增接收人后，系统将自动<span>发送验证信息</span>到所填手机号和邮箱，通过验证<span>并在消息接收设置页面分配消息接收人</span>后，方可接受对应类别的消息
              </p>
            </OPopover>
            <OIcon class="tip-icon" ref="tipRef"><TipIcon /></OIcon>
          </div>
        </template>
        <OTabPane :value="0" :label="$t('config.receiveConfig')">
          <SettingsSubscribe ref="subscribeSettings" />
        </OTabPane>
        <OTabPane :value="1" :label="$t('config.receiverManagement')">
          <SettingsRecipient ref="recipientSettings" />
        </OTabPane>
      </OTab>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.o-tab-nav-active) {
  --tab-nav-color-active: rgb(var(--o-kleinblue-6));
}

header {
  margin-top: 26px;
}

.page-body {
  margin-top: 26px;
  max-width: 1416px;

  @include respond-to('>laptop') {
    width: 1416px;
  }

  @include respond-to('<=laptop') {
    width: 80vw;
  }
}

.tips {
  max-width: 300px;
  @include text1;

  span {
    font-weight: bold;
  }
}
.tip-icon {
  font-size: 20px;
  cursor: pointer;

  @include hover {
    color: rgb(var(--o-kleinblue-6));
  }
}

.subs-config-btn-group {
  display: flex;
  gap: 24px;
}

.tabs {
  --tab-nav-justify: left;
  margin-top: 24px;
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
  @include h1;
}
</style>
