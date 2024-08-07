<script setup lang="ts">
import { computed, provide, reactive, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, OSubMenu, useMessage, OSelect, OOption, OPopover, OLink, ODivider, OIcon } from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';
import SettingsIcon from '~icons/app/icon-setting.svg';

import { EventSourceNames } from '@/data/subscribeSettings';
import { EventTypeNames } from '@/data/subscribeSettings';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useUserInfoStore } from '@/stores/user';
import { getCsrfToken } from '@/shared/login';
import { useUnreadMsgCountStore } from '@/stores/common';
import { usePage } from '@/composables/usePage';
import IconLink from '@/components/IconLink.vue';
import { useScreen } from '@/composables/useScreen';
import AppPagination from '@/components/AppPagination.vue';
import { usePhoneStore } from '@/stores/phone';
import MessageListFilterDlg from './components/MessageListFilterDlg.vue';

const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const settingsIcon = ref();
const expandedMenus = ref(Object.keys(EventSourceNames));
const messages = ref<MessageT[]>([]);
dayjs.locale(locale.value);
const showTipPopOver = ref(false);
const userInfoStore = useUserInfoStore();

watchEffect(() => {
  if (getCsrfToken() && userInfoStore.username && userInfoStore.photo) {
    const showTipCount = Number(sessionStorage.getItem('showTipCount') ?? '0');
    if (Number(showTipCount) < 1) {
      showTipPopOver.value = true;
      sessionStorage.setItem('showTipCount', (showTipCount + 1).toString());
    }
  }
});

const toConfig = () => router.push('/settings');

const { isPhone } = useScreen();

// ------------------------多选框事件------------------------
const {
  checkboxes,
  parentCheckbox,
  indeterminate,
  isCheckedAll,
  checkAll,
  clearCheckboxes
} = useCheckbox(messages, (msg) => msg.id);
provide('checkboxes', checkboxes);

// ------------------------获取数据------------------------
const isRead = ref<0 | 1 | undefined>();

const getData = (page = 1, pageSize = 10) => {
  getMessages(route.query?.source as string, route.query?.type as string, isRead.value, page, pageSize).then((res) => {
    const { count, query_info } = res.data;
    total.value = count;
    if (query_info) {
      for (const msg of query_info) {
        msg.id = msg.source + msg.event_id;
        const date = dayjs(msg.time);
        msg.formattedTime = date.fromNow();
      }
    }
    clearCheckboxes();
    messages.value = query_info ?? [];
  });
};
const { page, pageSize, total } = usePage(getData);

// ------------------------菜单事件------------------------
const activeMenu = ref('all');

const onMenuChange = (menu: string) => {
  if (menu === 'all') {
    router.push({ path: '/' });
  } else {
    const [source, type] = menu.split('_');
    router.push({ path: '/', query: { source, type } });
  }
};

watch(
  () => route.query,
  (query) => {
    page.value = 1;
    const { source, type } = query;
    if (source && type) {
      activeMenu.value = `${source}_${type}`;
    } else {
      activeMenu.value = 'all';
    }
  }
);

// ------------------------删除消息------------------------
const confirmDialogOptions = reactive({
  title: '',
  content: '',
});

const delMessage = async (msg: MessageT) => {
  confirmDialogOptions.title = '删除消息';
  confirmDialogOptions.content = `是否确定删除1条消息`;
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    deleteMessages(msg)
      .then(() => getData(page.value, pageSize.value))
      .catch((error) => {
        if (error?.response?.data?.message) {
          message.warning(error.response.data.message);
        }
      });
  }
};

/**
 * 删除多条
 */
const delMultiMessages = async () => {
  if (checkboxes.value.length === 0) {
    return;
  }
  const set = new Set(checkboxes.value);
  confirmDialogOptions.title = '删除消息';
  confirmDialogOptions.content = `是否确定删除${set.size}条消息`;
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    deleteMessages(...messages.value.filter((item) => set.has(item.id)))
      .then(() => {
        getData(page.value, pageSize.value);
      })
      .catch((error) => {
        if (error?.response?.data?.message) {
          message.warning(error.response.data.message);
        }
      });
  }
};

// ------------------------标记已读消息------------------------
const unreadCountStore = useUnreadMsgCountStore();
const multiReadDisabled = computed(() => {
  return checkboxes.value.length === 0 || messages.value.every((item) => item.is_read);
});

const markReadMessage = (msg: MessageT) => {
  if (msg.is_read) {
    return;
  }
  readMessages(msg)
    .then(() => {
      getData(page.value, pageSize.value);
      unreadCountStore.updateCount();
    })
    .catch((error) => {
      if (error?.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    });
};

/**
 * 已读多条
 */
const markReadMultiMessages = () => {
  if (checkboxes.value.length === 0) {
    return;
  }
  const set = new Set(checkboxes.value);
  readMessages(...messages.value.filter((item) => set.has(item.id)))
    .then(() => {
      getData(page.value, pageSize.value);
      unreadCountStore.updateCount();
    })
    .catch((error) => {
      if (error?.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    });
};

// ------------------------切换已读未读消息------------------------
const readStatus = ref('all');
const readStatusOptions = ref([
  { value: 'all', label: '全部消息' },
  { value: 1, label: '已读消息' },
  { value: 0, label: '未读消息' },
]);

watch(readStatus, (val: string | number) => {
  if (val === 'all') {
    isRead.value = undefined;
  } else {
    isRead.value = val as 0 | 1;
  }
  getData();
});

// ------------------------移动端------------------------
const phoneStore = usePhoneStore();

watch(checkboxes, val => {
  phoneStore.checkedCount = val.length;
});

watch(() => phoneStore.isManaging, val => {
  if (!val) {
    clearCheckboxes();
  }
});

watch(
  () => phoneStore.checkedAll,
  (val) => {
    if (val && !checkboxes.value.length) {
      checkAll();
      return;
    }
    if (!val && checkboxes.value.length) {
      clearCheckboxes();
    }
  }
);

watch(isCheckedAll, (val) => {
  if (val) {
    phoneStore.checkedAll = true;
  } else {
    phoneStore.checkedAll = false;
  }
});

const filterConfirm = (source: string, type: string) => {
  if (!source && !type) {
    router.push({ path: '/' });
    return;
  }
  router.push({ path: '/', query: { source, type } });
};
</script>

<template>
  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />

  <!-- 移动端特有弹窗 -->
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="filterConfirm"></MessageListFilterDlg>

  <!-- 移动端特有弹窗 -->
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="filterConfirm"></MessageListFilterDlg>

  <div class="messages-container">
    <aside v-if="!isPhone">
      <div class="title">
        消息中心
        <IconLink ref="settingsIcon" @click="toConfig">
          <template #suffix><SettingsIcon /></template>
        </IconLink>
        <OPopover :target="settingsIcon" :visible="showTipPopOver" trigger="none">
          <div class="first-time-login-tip">
            <p>可在消息订阅管理中订阅你所关注的消息</p>
            <OLink variant="text" @click="showTipPopOver = false">知道了</OLink>
          </div>
        </OPopover>
      </div>
      <OMenu v-model="activeMenu" :default-expanded="expandedMenus" @change="onMenuChange">
        <OMenuItem class="menu-item" value="all"> 全部消息 </OMenuItem>
        <template v-for="(evTypes, evSource) in EventTypeNames" :key="evSource">
          <template v-if="Object.keys(evTypes).length === 1">
            <OMenuItem v-for="(_, prop) in evTypes" :key="prop" class="menu-item" :value="`${evSource}_${prop}`">
              {{ EventSourceNames[evSource] }}
            </OMenuItem>
          </template>
          <OSubMenu class="submenu-title" v-else :value="`${evSource}`">
            <template #title>
              <p>{{ EventSourceNames[evSource] }}</p>
            </template>
            <OMenuItem v-for="(typeName, prop) in evTypes" :key="prop" class="menu-item" :value="`${evSource}_${prop}`">
              {{ typeName }}
            </OMenuItem>
          </OSubMenu>
        </template>
      </OMenu>
    </aside>

    <div class="message-list">
      <template v-if="total > 0">
        <div class="header">
          <div class="left">
            <OCheckbox v-if="!isPhone" v-model="parentCheckbox" :indeterminate="indeterminate" :value="1"></OCheckbox>
            <OSelect class="select" v-model="readStatus" variant="text" style="width: 112px">
              <OOption class="select-option" v-for="item in readStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
          </div>
          <div class="right" :disabled="checkboxes.length === 0">
            <template v-if="!isPhone">
              <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="checkboxes.length === 0" @click="delMultiMessages">
                <template #prefix><DeleteIcon /></template>
                删除
              </IconLink>
              <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="multiReadDisabled" @click="markReadMultiMessages">
                <template #prefix><ReadIcon /></template>
                标记已读
              </IconLink>
            </template>
            <OLink v-else-if="!phoneStore.isManaging" color="primary" @click="phoneStore.isManaging = true"> 管理 </OLink>
          </div>
        </div>
        <div class="list">
          <div v-for="(msg, index) in messages" :key="msg.id" class="item">
            <MessageListItem :msg="msg" @deleteMessage="() => delMessage(msg)" @readMessage="() => markReadMessage(msg)" />
            <ODivider v-if="index < messages.length - 1" class="divider-line" />
          </div>
        </div>
      </template>
      <div v-else class="no-messages">
        <img src="@/assets/svg-icons/icon-no-messages.svg" />
        <p>暂无消息</p>
      </div>

      <template v-if="isPhone && phoneStore.isManaging">
        <div style="height: 62px;"></div>
        <Teleport to="body">
          <div class="phone-footer">
            <div @click="markReadMultiMessages">
              <OIcon class="icon"><ReadIcon /></OIcon>
              <p>标为已读</p>
            </div>
            <div @click="delMultiMessages">
              <OIcon class="icon"><DeleteIcon /></OIcon>
              <p>删除</p>
            </div>
          </div>
        </Teleport>
      </template>
    </div>
  </div>
  <AppPagination v-if="!isPhone && total > 0" topMargin="40px" :total="total" v-model:page="page" v-model:pageSize="pageSize" />
</template>

<style scoped lang="scss">
:deep(.message-delete-read) {
  @include tip1;
}

.phone-footer {
  width: 100%;
  position: fixed;
  background-color: var(--o-color-fill2);
  bottom: 0;
  left: 0;
  height: 62px;
  gap: 68px;
  display: flex;
  justify-content: center;
  align-items: center;

  div {
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon {
      font-size: 24px;
    }

    p {
      @include tip2;
    }
  }
}

.select-option {
  justify-content: center;

  @include respond-to('>phone') {
    width: 144px;
  }
}

.menu-item {
  --menu-item-bg-color-selected: var(--o-color-control3-light);
  --menu-item-bg-color-hover: var(--o-color-control2-light);
  --menu-item-color-selected: rgb(var(--o-kleinblue-6));
  @include text1;
}

.submenu-title {
  margin-top: 2px;
  --sub-menu-bg-color-hover: var(--o-color-control2-light);
  --sub-menu-bg-color-selected: var(--o-color-control3-light);
}

.first-time-login-tip {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 10px;
  @include tip1;

  p {
    width: 168px;
  }
}

:deep(.o-pagination-wrap) {
  justify-content: flex-end;
}

.messages-container {
  display: flex;
  gap: 32px;
  max-width: 1418px;
  min-height: 60vh;
  margin-top: 64px;

  @include respond-to('>laptop') {
    width: 1416px;
  }

  @include respond-to('pad-laptop') {
    width: 80vw;
    min-width: 960px;
  }

  @include respond-to('phone') {
    margin-top: 0;
    width: 100%;
  }

  aside {
    .title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      @include h1;
    }
  }
}

.message-list {
  flex-grow: 1;
  background-color: var(--o-color-fill2);
  padding: 16px;
  height: 100%;
  gap: 10px;

  @include respond-to('phone') {
    width: 100%;
    padding-top: 0;
  }

  .header {
    // position: sticky;
    // top: 0;
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-left: 12px;

    @include respond-to('phone') {
      margin-top: var(--layout-header-height);
      width: 100%;
      padding: 16px 0;
      margin-bottom: 0;
      background-color: var(--o-color-fill2);
      z-index: 10;

      .select {
        --select-padding: 0;
      }
    }

    .left {
      display: flex;
      align-items: center;
      @include text1;
    }

    .right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .item {
      height: 70px;
      position: relative;
      display: flex;
      border-radius: 4px;
      padding: 0 12px;

      @include respond-to('phone') {
        height: auto;
        padding: 16px 0;
      }

      .divider-line {
        position: absolute;
        bottom: 0;
        transform: translateY(2px);
        --o-divider-gap: 0;
        width: calc(100% - 56px);
        left: 56px;
      }

      @include hover {
        background-color: rgb(var(--o-kleinblue-1));
      }
    }
  }
}

.no-messages {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 900px;
  gap: 24px;
  font-size: 16px;
  color: var(--o-color-info3);

  @include respond-to('phone') {
    height: 100vh;
  }

  img {
    height: 162px;
    width: 276px;
  }
}

.checkbox-wrapper {
  height: 65%;
}

:deep(.o-collapse-item-body) {
  padding-bottom: 4px;
}
</style>
