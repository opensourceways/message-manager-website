<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useConfirmDialog, useDocumentVisibility } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, useMessage, ODivider, OTab, OTabPane, OSelect, OOption, OLink } from '@opensig/opendesign';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppPagination from '@/components/AppPagination.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import MessageList from './components/MessageList.vue';
import IconLink from '@/components/IconLink.vue';

import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';

import { useUserInfoStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import type { MessageT } from '@/@types/type-messages';
import {
  deleteMessages,
  readMessages,
  getForumSystem,
  getForumAbout,
  getMeetingTodo,
  getCve,
  getIssueTodo,
  getPrTodo,
  getGiteeAbout,
  getGitee,
  getEur,
  getAllTodo,
  getAllAbout,
  getAllWatch,
} from '@/api/api-messages';

import MessageSubsConfig from './components/MessageSubsConfig.vue';
import type { PagedResponseT } from '@/@types/types-common';
import usePoll from '@/composables/usePoll';
import { AxiosError } from 'axios';
import { useTheme } from '@/composables/useTheme';

const { isDark } = useTheme();
const userInfoStore = useUserInfoStore();
const message = useMessage();
const { locale } = useI18n();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const unreadCountStore = useUnreadMsgCountStore();
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;
const goBindUserInfo = () => (window.location.href = LOGIN_URL);
const documentVisibility = useDocumentVisibility();

const dlgVisible = ref(false);

dayjs.locale(locale.value);

const showNoEmail = ref(false);
onMounted(() => {
  unreadCountStore.updateCount();
  getData();
  if (!userInfoStore.email) {
    showNoEmail.value = true;
    return;
  }
});

const total = ref(0);
const pageInfo = reactive({
  page_num: 1,
  count_per_page: 10,
});

const { start, stop } = usePoll(10000);
watch(documentVisibility, (state) => {
  if (state === 'hidden') {
    stop();
  } else {
    getData();
  }
});
const messages = ref<MessageT[]>([]);
const getData = async () => {
  await stop();
  const fetchFn = currentMeneItem.value!.getFetchFn();
  for await (const res of start(fetchFn)) {
    total.value = res.count;
    const list = res.query_info ?? [];
    list.forEach((item) => (item.id = item.source + item.event_id));
    messages.value = list;
  }
};

const tabList: Record<string, string> = {
  todo: '待处理的任务',
  meeting: '待参加的会议',
  about: '提到我的',
  watch: '我关注的',
};
const tabVal = ref<string>('todo');

// ------------------------下拉框------------------------
const options: Record<string, { label: string; val: any }[]> = {
  todo: [
    { label: '待处理', val: 0 },
    { label: '已处理', val: 1 },
  ],
  meeting: [
    { label: '全部', val: 0 },
    { label: '待参加', val: 1 },
    { label: '已过期', val: 2 },
  ],
  about: [
    { label: '全部', val: '' },
    { label: '非机器人', val: 0 },
    { label: '机器人', val: 1 },
  ],
  watch: [],
};
const optionVal = ref(options.todo[0].val);
const currentOptions = computed(() => options[tabVal.value]);
watch(
  currentOptions,
  (options) => {
    if (options?.length) {
      optionVal.value = options[0].val;
      return;
    }
    optionVal.value = '';
  },
  { immediate: true }
);

// ----------------toggle按钮----------------
const currentDate = dayjs();
const toggles = reactive({
  isRead: {
    options: [
      { value: 0, label: '全部' },
      { value: 1, label: '未读' },
    ],
    val: 0,
  },
  time: {
    options: [
      { label: '至今', value: 0 },
      { label: '近一月', value: currentDate.subtract(1, 'month').valueOf() },
      { label: '近一周', value: currentDate.subtract(7, 'day').valueOf() },
    ],
    val: 0,
  },
});
const resetToggleVals = () => {
  toggles.isRead.val = 0;
  toggles.time.val = 0;
};

const onTabChange = async () => {
  resetToggleVals();
  await nextTick();
  pageInfo.page_num = 1;
  getData();
};

// ------------------------菜单事件------------------------
const menuInfo: Record<string, { title: string; needGitee?: boolean; getFetchFn: () => (...args: any[]) => Promise<PagedResponseT<MessageT>> }[]> = {
  todo: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllTodo.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
    },
    {
      title: '待我处理的Issue',
      getFetchFn: () =>
        getIssueTodo.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
      needGitee: true,
    },
    {
      title: '待我审查的PR',
      getFetchFn: () =>
        getPrTodo.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
      needGitee: true,
    },
  ],
  meeting: [
    {
      title: '全部',
      getFetchFn: () =>
        getMeetingTodo.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
          filter: optionVal.value,
        }),
    },
  ],
  about: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllAbout.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
    },
    {
      title: 'Gitee',
      getFetchFn: () =>
        getGiteeAbout.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
      needGitee: true,
    },
    {
      title: '论坛',
      getFetchFn: () =>
        getForumAbout.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
    },
  ],
  watch: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllWatch.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
    },
    {
      title: 'EUR系统',
      getFetchFn: () =>
        getEur.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
    },
    {
      title: 'Gitee消息',
      getFetchFn: () =>
        getGitee.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
      needGitee: true,
    },
    {
      title: '漏洞消息',
      getFetchFn: () =>
        getCve.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
          gitee_user_name: userInfoStore.giteeLoginName as string,
        }),
    },
    {
      title: '论坛',
      getFetchFn: () =>
        getForumSystem.bind(null, {
          is_read: toggles.isRead.val ? false : undefined,
          ...pageInfo,
          start_time: toggles.time.val || undefined,
        }),
    },
  ],
};
const activeMenu = ref<string>();
const currentMenuItems = computed(() => menuInfo[tabVal.value]);
watch(currentMenuItems, (val) => (activeMenu.value = val[0].title), { immediate: true });
const currentMeneItem = computed(() => currentMenuItems.value.find((item) => item.title === activeMenu.value));
const onMenuChange = async () => {
  await nextTick();
  pageInfo.page_num = 1;
  getData();
};

const noMessageDesc = computed(() => {
  if (tabVal.value === 'about' || tabVal.value === 'watch') {
    return `没有${tabList[tabVal.value]}消息`;
  }
  return `没有${tabList[tabVal.value]}`;
});

// ------------------------多选框事件------------------------
const messageListRef = ref<InstanceType<typeof MessageList>>();
const checkboxVal = ref<(string | number)[]>([]);

const indeterminate = computed(() => {
  const length = checkboxVal.value.length;
  if (!messages.value.length || !length) {
    return false;
  }
  return length > 0 && length < messages.value.length;
});

const checkAllVal = computed({
  get() {
    if (!messages.value.length) {
      return [];
    }
    return messages.value.length === checkboxVal.value.length ? [1] : [];
  },
  set(val: (string | number)[]) {
    if (val.length) {
      messageListRef.value?.checkAll();
    } else {
      messageListRef.value?.clearCheckboxes();
    }
  },
});

// ------------------------删除消息------------------------
const confirmDialogOptions = reactive({
  title: '',
  content: '',
});

const delMessage = async (msg: MessageT) => {
  confirmDialogOptions.title = '删除消息';
  confirmDialogOptions.content = `是否确定删除此消息`;
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteMessages(msg);
      message.success({ content: '删除成功' });
      messageListRef.value?.clearCheckboxes();
      getData();
      unreadCountStore.updateCount();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    }
  }
};

/**
 * 删除多条
 */
const delMultiMessages = async () => {
  if (checkboxVal.value.length === 0) {
    return;
  }
  const set = new Set(checkboxVal.value);
  confirmDialogOptions.title = '删除消息';
  if (set.size > 1) {
    confirmDialogOptions.content = `是否确定删除${set.size}条消息`;
  } else {
    confirmDialogOptions.content = `是否确定删除此消息`;
  }
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteMessages(...messages.value.filter((item) => set.has(item.id)));
      if (set.size > 1) {
        message.success({ content: '批量删除成功' });
      } else {
        message.success({ content: '删除成功' });
      }
      messageListRef.value?.clearCheckboxes();
      getData();
      unreadCountStore.updateCount();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    }
  }
};

// ------------------------标记已读消息------------------------
const markReadMessage = (msg: MessageT) => {
  if (msg.is_read) {
    return;
  }
  readMessages(msg)
    .then(() => {
      getData();
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
  if (checkboxVal.value.length === 0) {
    return;
  }
  const set = new Set(checkboxVal.value);
  readMessages(...messages.value.filter((item) => set.has(item.event_id)))
    .then(() => {
      getData();
      unreadCountStore.updateCount();
      messageListRef.value?.clearCheckboxes();
    })
    .catch((error) => {
      if (error?.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    });
};
</script>

<template>
  <ConfirmDialog title="未绑定邮箱" content="请绑定邮箱" v-model:show="showNoEmail" @confirm="goBindUserInfo" confirm-text="前往绑定"></ConfirmDialog>
  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />
  <MessageSubsConfig v-model:visible="dlgVisible" />
  <h1 class="title">消息中心</h1>
  <div class="msg-list-content">
    <div :class="[isDark ? 'msg-list-content-header-dark' : 'msg-list-content-header']">
      <OTab
        v-model="tabVal"
        :line="false"
        @change="onTabChange"
        style="--tab-nav-padding: 22px 0; --tab-nav-color-active: rgb(var(--o-kleinblue-6))"
        variant="text"
      >
        <OTabPane v-for="(value, key) in tabList" :key="key" :label="key">
          <template #nav>{{ value }}&#009;{{ unreadCountStore.sourceCountMap.get(`${key}_count`) || '' }}</template>
        </OTabPane>
      </OTab>
    </div>
    <div class="msg-list-content-inner">
      <aside>
        <OMenu v-model="activeMenu" @change="onMenuChange" style="margin-right: 12px">
          <template v-for="(item, index) in currentMenuItems" :key="item.title">
            <OMenuItem v-if="index === 0" :class="[isDark ? 'menu-item-dark' : 'menu-item']" :value="item.title">
              {{ item.title }}
            </OMenuItem>
            <OMenuItem v-else :class="[isDark ? 'menu-item-dark' : 'menu-item']" :value="item.title">
              <p style="margin-left: 16px">
                {{ item.title }}
              </p>
            </OMenuItem>
          </template>
        </OMenu>
      </aside>
      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="checkAllVal" :indeterminate="indeterminate" style="--checkbox-label-gap: 28px" :disabled="!messages.length" :value="1">
              {{ checkboxVal.length ? `已选 ${checkboxVal.length} 条消息` : '全选' }}
            </OCheckbox>
            <template v-if="!checkboxVal.length">
              <template v-if="tabVal !== 'todo' && tabVal !== 'meeting'">
                <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
                <RadioToggle v-model="toggles.isRead.val" @change="getData()" :options="toggles.isRead.options" />
              </template>
              <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
              <RadioToggle v-model="toggles.time.val" @change="getData()" :options="toggles.time.options" />
            </template>
          </div>
          <div class="right">
            <template v-if="checkboxVal.length">
              <IconLink :label-class-names="['message-delete-read']" iconSize="24px" @click="markReadMultiMessages">
                <template #prefix><IconRead /></template>
                标记已读
              </IconLink>
              <IconLink :label-class-names="['message-delete-read']" hover-color="var(--o-color-danger1)" iconSize="24px" @click="delMultiMessages">
                <template #prefix><IconDelete /></template>
                删除
              </IconLink>
            </template>
            <OSelect v-model="optionVal" @change="getData" v-else-if="currentOptions.length" style="--select-radius: 4px; width: 120px">
              <OOption style="justify-content: center" v-for="item in currentOptions" :key="item.val" :label="item.label" :value="item.val">{{
                item.label
              }}</OOption>
            </OSelect>
          </div>
        </div>
        <!-- 消息列表 -->
        <MessageList
          v-if="total > 0"
          ref="messageListRef"
          :messages="messages"
          @delete-message="delMessage"
          @read-message="markReadMessage"
          v-model:checkboxes="checkboxVal"
        />
        <div v-else class="no-messages">
          <img v-if="isDark" src="@/assets/no-message-dark.png" />
          <img v-else src="@/assets/svg-icons/icon-no-messages.svg" />
          <p>{{ noMessageDesc }}</p>
          <p v-if="currentMeneItem?.needGitee && !userInfoStore.giteeLoginName">
            接收Gitee消息，请<OLink
              :href="LOGIN_URL"
              target="_blank"
              rel="noreferrer noopener"
              style="--link-color: var(--o-color-primary1); font-weight: bold; --link-color-hover: rgb(var(--o-kleinblue-4))"
              >绑定Gitee账号</OLink
            >
          </p>
        </div>
      </div>
    </div>
  </div>
  <AppPagination v-if="total > 0" :total="total" @change="getData" v-model:page="pageInfo.page_num" v-model:pageSize="pageInfo.count_per_page" />
</template>

<style scoped lang="scss">
:deep(.o-menu-item-content) {
  width: 100%;
}

:deep(.message-delete-read) {
  @include text1;
}

:deep(.o-tab-nav-anchor-line) {
  width: 100%;
}

.msg-filter-sel-option {
  justify-content: center;
}

.msg-filter-sel-option-dark {
  justify-content: center;
}

.title {
  @include h1;
  font-weight: 500;
  margin-bottom: 24px;

  .icon {
    font-size: 20px;
    cursor: pointer;
  }
}

.select-option {
  justify-content: center;

  @include respond-to('>phone') {
    width: 144px;
  }
}

.msg-list-content {
  background-color: var(--o-color-fill2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @mixin header-ops {
    display: flex;
    background-size: cover;
    padding: 0 24px;
    position: relative;
  }

  .msg-list-content-header {
    @include header-ops;
    background-image: url('../../assets/tab-background.png');
  }

  .msg-list-content-header-dark {
    @include header-ops;
    background-image: url('../../assets/tab-background-dark.png');
  }

  .msg-list-content-inner {
    display: flex;
    margin-top: 24px;
    padding: 24px;
    padding-top: 0;

    aside {
      border-right: 1px solid var(--o-color-control4);
      padding-right: 12px;
    }
  }
}

.menu-item {
  --menu-item-radius: 4px;
  --menu-item-bg-color-selected: rgb(var(--o-kleinblue-2));
  --menu-item-bg-color-hover: rgb(var(--o-kleinblue-1));
  --menu-item-color-selected: rgb(var(--o-kleinblue-6));
}

.menu-item-dark {
  --menu-item-radius: 4px;
  --menu-item-bg-color-selected: rgb(var(--o-mixedgray-6));
  --menu-item-bg-color-hover: var(--o-color-fill3);
  --menu-item-color-selected: rgb(var(--o-kleinblue-6));
}

.message-list {
  background-color: var(--o-color-fill2);
  gap: 10px;
  width: 0;
  min-height: 784px;
  flex-grow: 1;
  margin-left: 12px;

  @include respond-to('phone') {
    width: 100%;
    padding-top: 0;
  }

  .header {
    height: var(--o-control_size-m);
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-left: 12px;

    .left {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      @include text1;

      & > :not(:first-child):not(.select) {
        margin-left: 16px;
      }
    }

    .right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }
}

.no-messages {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 736px;
  color: var(--o-color-info3);
  @include text1;

  img {
    height: 162px;
    width: 276px;
    margin-bottom: 24px;
  }
}

.checkbox-wrapper {
  height: 65%;
}

:deep(.o-collapse-item-body) {
  padding-bottom: 4px;
}
</style>
