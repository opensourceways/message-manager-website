<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useConfirmDialog, useDocumentVisibility } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, useMessage, ODivider, OTab, OTabPane, OSelect, OOption, OLink, OIconLoading } from '@opensig/opendesign';
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
  getCveTodo,
} from '@/api/api-messages';

import MessageSubsConfig from './components/MessageSubsConfig.vue';
import type { PagedResponseT } from '@/@types/types-common';
import usePoll from '@/composables/usePoll';
import { AxiosError } from 'axios';
import { useTheme } from '@/composables/useTheme';
// import MeetingMessages from './components/meeting/MeetingMessages.vue';

const { isDark } = useTheme();
const userInfoStore = useUserInfoStore();
const message = useMessage();
const { locale } = useI18n();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const unreadCountStore = useUnreadMsgCountStore();
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;
const goBindUserInfo = () => (window.location.href = LOGIN_URL);
const documentVisibility = useDocumentVisibility();
const loading = ref(false);

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

// ----------------翻页----------------
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
const getData = async (noLoading?: boolean) => {
  messageListRef.value?.clearCheckboxes();
  if (!noLoading) {
    loading.value = true;
  }
  await stop();
  const fetchFn = currentMeneItem.value!.getFetchFn();
  for await (const { res, err } of start(fetchFn)) {
    if (!err) {
      total.value = res.count;
      const list = res.query_info ?? [];
      list.forEach((item) => (item.id = item.source + item.event_id));
      messages.value = list;
    } else {
      total.value = 0;
      messages.value = [];
    }
    loading.value = false;
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
      if (tabVal.value === 'meeting') {
        optionVal.value = options[1].val;
      } else {
        optionVal.value = options[0].val;
      }
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

// ------------------------tab事件------------------------
const onTabChange = async () => {
  resetToggleVals();
  pageInfo.page_num = 1;
  messages.value = [];
  getData();
};

const onFilterStateChange = () => {
  pageInfo.page_num = 1;
  getData();
};

// ------------------------菜单事件------------------------
const defaultParams = () => ({
  is_read: toggles.isRead.val ? false : undefined,
  ...pageInfo,
  start_time: toggles.time.val || undefined,
});
const menuInfo: Record<string, { title: string; needGitee?: boolean; getFetchFn: () => (...args: any[]) => Promise<PagedResponseT<MessageT>> }[]> = {
  todo: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllTodo.bind(null, {
          ...defaultParams(),
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
    },
    {
      title: '待我处理的Issue',
      getFetchFn: () =>
        getIssueTodo.bind(null, {
          ...defaultParams(),
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
      needGitee: true,
    },
    {
      title: '待我审查的PR',
      getFetchFn: () =>
        getPrTodo.bind(null, {
          ...defaultParams(),
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
      needGitee: true,
    },
    {
      title: '待我处理的漏洞',
      getFetchFn: () =>
        getCveTodo.bind(null, {
          ...defaultParams(),
          is_done: Boolean(optionVal.value),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
      needGitee: true,
    },
  ],
  meeting: [
    {
      title: '全部',
      getFetchFn: () =>
        getMeetingTodo.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
          filter: optionVal.value,
        }),
    },
  ],
  about: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllAbout.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
    },
    {
      title: 'Gitee',
      getFetchFn: () =>
        getGiteeAbout.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
      needGitee: true,
    },
    {
      title: '论坛',
      getFetchFn: () =>
        getForumAbout.bind(null, {
          ...defaultParams(),
          is_bot: optionVal.value !== '' ? Boolean(optionVal.value) : undefined,
        }),
    },
  ],
  watch: [
    {
      title: '全部',
      getFetchFn: () =>
        getAllWatch.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
    },
    {
      title: 'EUR系统',
      getFetchFn: () =>
        getEur.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
    },
    {
      title: 'Gitee消息',
      getFetchFn: () =>
        getGitee.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
      needGitee: true,
    },
    {
      title: '漏洞消息',
      getFetchFn: () =>
        getCve.bind(null, {
          ...defaultParams(),
          gitee_user_name: userInfoStore.giteeLoginName!,
        }),
    },
    {
      title: '论坛',
      getFetchFn: () => getForumSystem.bind(null, defaultParams()),
    },
  ],
};
const activeMenu = ref<string>();
const currentMenuItems = computed(() => menuInfo[tabVal.value]);
watch(currentMenuItems, (val) => (activeMenu.value = val[0].title), { immediate: true });
const currentMeneItem = computed(() => currentMenuItems.value.find((item) => item.title === activeMenu.value));
const onMenuChange = async () => {
  pageInfo.page_num = 1;
  messages.value = [];
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

watch(
  () => checkboxVal.value.length,
  (length) => {
    if (length) {
      stop();
    } else {
      getData(true);
    }
  }
);

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

const selectedMessages = computed(() => {
  try {
    const set = new Set(checkboxVal.value);
    return messages.value.filter((item) => set.has(item.id));
  } catch {
    return [];
  }
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
  confirmDialogOptions.title = '删除消息';
  const isMulti = checkboxVal.value.length > 1;
  confirmDialogOptions.content = isMulti ? `是否确定删除${checkboxVal.value.length}条消息` : '是否确定删除此消息';
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    try {
      await deleteMessages(...selectedMessages.value);
      message.success({ content: isMulti ? '批量删除成功' : '删除成功' });
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
  readMessages(...selectedMessages.value)
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
</script>

<template>
  <ConfirmDialog title="未绑定邮箱" content="请绑定邮箱" v-model:show="showNoEmail" @confirm="goBindUserInfo" confirm-text="前往绑定"></ConfirmDialog>
  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />
  <MessageSubsConfig v-model:visible="dlgVisible" />
  <h1 class="title">消息中心</h1>
  <div class="the-msg-list">
    <div class="msg-list-tabs">
      <OTab
        v-model="tabVal"
        :line="false"
        @change="onTabChange"
        style="--tab-nav-padding: 22px 0; --tab-nav-color-active: rgb(var(--o-kleinblue-6))"
        variant="text"
      >
        <OTabPane v-for="(value, key) in tabList" :key="key" :label="key">
          <template #nav>{{ value }}&#009;{{ unreadCountStore.sourceCountMap.get(`${key}_count`)?.displayCount || '' }}</template>
        </OTabPane>
      </OTab>
    </div>
    <div class="msg-list-content">
      <aside>
        <OMenu v-model="activeMenu" @change="onMenuChange" style="margin-right: 12px">
          <template v-for="(item, index) in currentMenuItems" :key="item.title">
            <OMenuItem v-if="index === 0" class="menu-item" :value="item.title">
              {{ item.title }}
            </OMenuItem>
            <OMenuItem v-else class="menu-item" :value="item.title">
              <p style="margin-left: 16px">
                {{ item.title }}
              </p>
            </OMenuItem>
          </template>
        </OMenu>
      </aside>
      <div class="msg-list-main">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="checkAllVal" :indeterminate="indeterminate" style="--checkbox-label-gap: 28px" :disabled="!messages.length" :value="1">
              {{ checkboxVal.length ? `已选 ${checkboxVal.length} 条消息` : '全选' }}
            </OCheckbox>
            <template v-if="!checkboxVal.length">
              <template v-if="tabVal !== 'todo' /*  && tabVal !== 'meeting' */">
                <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
                <RadioToggle v-model="toggles.isRead.val" @change="onFilterStateChange" :options="toggles.isRead.options" />
              </template>
              <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
              <RadioToggle v-model="toggles.time.val" @change="onFilterStateChange" :options="toggles.time.options" />
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
            <OSelect v-model="optionVal" @change="onFilterStateChange" v-else-if="currentOptions.length" style="--select-radius: 4px; width: 120px">
              <OOption style="justify-content: center" v-for="item in currentOptions" :key="item.val" :label="item.label" :value="item.val">{{
                item.label
              }}</OOption>
            </OSelect>
          </div>
        </div>
        <div v-if="loading || !total" class="no-messages">
          <OIconLoading v-if="loading" class="loading" />
          <template v-else>
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
          </template>
        </div>
        <!-- <MeetingMessages v-else-if="tabVal === 'meeting'" :messages="messages" /> -->
        <!-- 消息列表 -->
        <MessageList
          v-else
          ref="messageListRef"
          :messages="messages"
          @delete-message="delMessage"
          @read-message="markReadMessage"
          v-model:checkboxes="checkboxVal"
        />
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

.the-msg-list {
  background-color: var(--o-color-fill2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .msg-list-tabs {
    display: flex;
    background-size: cover;
    padding: 0 24px;
    position: relative;
    background-image: url('../../assets/tab-background.png');

    html[data-o-theme='dark'] & {
      background-image: url('../../assets/tab-background-dark.png');
    }
  }

  .msg-list-content {
    display: flex;
    margin-top: 24px;
    padding: 24px;
    padding-top: 0;

    aside {
      border-right: 1px solid var(--o-color-control4);
      padding-right: 12px;
      margin-right: 24px;
    }
  }
}

.menu-item {
  --menu-item-radius: 4px;
  --menu-item-bg-color-selected: rgb(var(--o-kleinblue-2));
  --menu-item-bg-color-hover: rgb(var(--o-kleinblue-1));
  --menu-item-color-selected: rgb(var(--o-kleinblue-6));

  html[data-o-theme='dark'] & {
    --menu-item-bg-color-selected: rgb(var(--o-mixedgray-6));
    --menu-item-bg-color-hover: var(--o-color-fill3);
    --menu-item-color-selected: rgb(var(--o-kleinblue-6));
  }
}

.msg-list-main {
  background-color: var(--o-color-fill2);
  gap: 10px;
  width: 0;
  min-height: 784px;
  flex-grow: 1;
  position: relative;

  @include respond-to('phone') {
    width: 100%;
    padding-top: 0;
  }

  .header {
    height: var(--o-control_size-m);
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;

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
  z-index: 100;
  background-color: var(--o-color-fill2);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
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

  .loading {
    font-size: 30px;
    animation-duration: 1s;
    animation-name: spin;
    animation-iteration-count: infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.checkbox-wrapper {
  height: 65%;
}

:deep(.o-collapse-item-body) {
  padding-bottom: 4px;
}
</style>
