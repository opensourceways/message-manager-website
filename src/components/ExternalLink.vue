<script lang="ts" setup>
import { ref } from 'vue';
import { OButton, ODialog } from '@opensig/opendesign';
import { windowOpen } from '@/utils/common';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  href: {
    type: String,
    required: true,
    default: () => '',
  },
});
const showDlg = ref(true);
const { t } = useI18n();
const jumpOut = () => {
  windowOpen(props.href, '_blank');
};

const emits = defineEmits<{
  (e: 'change'): void;
}>();

const onChange = () => {
  emits('change');
};
</script>

<template>
  <ODialog v-model:visible="showDlg" :unmount-on-hide="true" :mask="true" size="medium" @change="onChange" class="external-dialog">
    <template #header>
      <p class="external-title">{{ t('software.external.title') }}</p>
    </template>
    <div class="external-content">
      <p class="text">{{ t('software.external.text') }}</p>
      <div class="content-link">
        <div class="external-link-href" :title="href">{{ href }}</div>
      </div>
    </div>
    <template #footer>
      <div class="dlg-action">
        <OButton variant="solid" size="large" color="primary" class="upload" @click="jumpOut">{{ t('software.external.btn[0]') }}</OButton>
        <OButton variant="outline" size="large" color="primary" class="upload" @click="onChange">{{ t('software.external.btn[1]') }}</OButton>
      </div>
    </template>
  </ODialog>
</template>

<style lang="scss" scoped>
.dlg-action {
  display: flex;
  justify-content: center;
  .o-btn + .o-btn {
    margin-left: 16px;
  }
}
.external-content {
  margin: 0 0 24px;
  max-width: 600px;
  .text {
    @include text2;
    color: var(--o-color-info1);
  }
  .content-link {
    @include text2;
    color: var(--o-color-info2);
    margin-top: 24px;
    word-break: break-all;
    .external-link-href {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      position: relative;
      word-break: break-all;
    }
  }
}
</style>
