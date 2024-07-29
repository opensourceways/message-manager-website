<script setup lang="ts">
import { reactive, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, OPagination, OSubMenu, useMessage, OSelect, OOption, OPopover, OLink, ODivider } from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DeleteIcon from '~icons/app/icon-delete.svg';
import ReadIcon from '~icons/app/icon-read.svg';
import SettingsIcon from '~icons/app/icon-setting.svg';

import { events } from '@/data/subscribeSettings';
import { eventTypeNames } from '@/data/subscribeSettings';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useUserInfoStore } from '@/stores/user';
import { getCsrfToken } from '@/shared/login';
import { useUnreadMsgCountStore } from '@/stores/common';
import { usePage } from '@/composables/usePage';
import IconLink from '@/components/IconLink.vue';

const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const settingsIcon = ref();
const expandedMenus = ref(events.map((_, index) => `${index}`));
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

// ------------------------多选框事件------------------------
const { checkboxes, parentCheckbox, indeterminate } = useCheckbox(messages, (msg) => msg.id);

// ------------------------获取数据------------------------
const requestParams = reactive({
  source: '',
  eventType: '',
  isRead: undefined as 0 | 1 | undefined,
});

const getData = (page = 1, pageSize = 10) => {
  getMessages(requestParams.source, requestParams.eventType, requestParams.isRead, page, pageSize).then((res) => {
    const { count, query_info } = res.data;
    total.value = count;
    for (const msg of query_info) {
      msg.id = msg.source + msg.event_id;
      const date = dayjs(msg.time);
      msg.formattedTime = date.fromNow();
    }
    messages.value = query_info;
  });
};
const { page, pageSize, total } = usePage(getData);

// ------------------------菜单事件------------------------
const activeMenu = ref('all');

watch(activeMenu, (menu) => {
  if (menu === 'all') {
    requestParams.source = '';
    requestParams.eventType = '';
  } else {
    const [source, type] = menu.split('_');
    requestParams.source = source;
    requestParams.eventType = type;
  }
  page.value = 1;
});

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

const markReadMessage = (msg: MessageT) => {
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
const selectedVal = ref('all');
const selectOptions = ref([
  { value: 'all', label: '全部消息' },
  { value: 'read', label: '已读消息' },
]);

watch(selectedVal, (val) => {
  if (val === 'all') {
    requestParams.isRead = undefined;
  } else {
    requestParams.isRead = 1;
  }
  getData();
});
</script>

<template>
  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />
  <div class="messages-container">
    <aside>
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
      <OMenu v-model="activeMenu" :default-expanded="expandedMenus">
        <OMenuItem class="menu-item" value="all"> 全部消息 </OMenuItem>
        <template v-for="(ev, index) in events" :key="ev.source + (ev.event_type ?? '')">
          <OMenuItem class="menu-item" v-if="!ev.children" :value="`${ev.source}_${ev.event_type}`">
            {{ eventTypeNames[ev.source][ev.event_type] }}
          </OMenuItem>
          <OSubMenu class="submenu-title" v-else :value="`${index}`">
            <template #title>
              <p>{{ eventTypeNames[ev.source].default }}</p>
            </template>
            <OMenuItem class="menu-item" v-for="child in ev.children" :key="child.event_type" :value="`${ev.source}_${child.event_type}`">
              {{ eventTypeNames[ev.source][child.event_type] }}
            </OMenuItem>
          </OSubMenu>
        </template>
      </OMenu>
    </aside>

    <div class="message-list">
      <template v-if="total > 0">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="parentCheckbox" :indeterminate="indeterminate" :value="1"></OCheckbox>
            <OSelect v-model="selectedVal" variant="text" style="width: 112px">
              <OOption class="select-option" v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
          </div>
          <div class="right" :disabled="checkboxes.length === 0">
            <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="checkboxes.length === 0" @click="delMultiMessages">
              <template #prefix><DeleteIcon /></template>
              删除
            </IconLink>
            <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="checkboxes.length === 0" @click="markReadMultiMessages">
              <template #prefix><ReadIcon /></template>
              标记已读
            </IconLink>
          </div>
        </div>
        <div class="list">
          <div v-for="(msg, index) in messages" :key="msg.id" class="item">
            <MessageListItem :msg="msg" @deleteMessage="delMessage" @readMessage="markReadMessage" />
            <ODivider v-if="index < messages.length - 1" class="divider-line" />
          </div>
        </div>
      </template>
      <div v-else class="no-messages">
        <img src="@/assets/svg-icons/icon-no-messages.svg" />
        <p>暂无消息</p>
      </div>
    </div>
  </div>
  <OPagination v-if="total > 0" :total="total" v-model:page="page" v-model:pageSize="pageSize" :pageSizes="[10, 20, 30, 50]" show-total />
</template>

<style scoped lang="scss">
:deep(.message-delete-read) {
  @include tip1;
}

.select-option {
  width: 144px;
  justify-content: center;
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

:deep(.o-collapse-item) {
  border: none;
}

:deep(.o-pagination-wrap) {
  justify-content: flex-end;
}

:deep(.o-collapse) {
  padding: 0%;
}

.settings-icon {
  font-size: 24px;
}

.msg-action {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  @include tip1;

  .icon {
    font-size: 24px;
  }

  @include hover {
    color: rgb(var(--o-kleinblue-6));

    .icon {
      color: rgb(var(--o-kleinblue-6));
    }
  }

  &[diabled='true'] {
    opacity: 0.3;
    color: #000;
  }
}

.messages-container {
  display: flex;
  gap: 32px;
  max-width: 1418px;
  min-height: 60vh;
  margin-top: 64px;

  @include respond-to('<=laptop') {
    width: 80vw;
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

  @include respond-to('>laptop') {
    width: 1120px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-left: 12px;

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
