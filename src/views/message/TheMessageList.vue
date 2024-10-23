<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, useMessage, OLink, ODivider, OPopup, OBadge, OIconFilter } from '@opensig/opendesign';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppPagination from '@/components/AppPagination.vue';
import ContentWrapper from '@/components/ContentWrapper.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import MessageCommonFilter from './components/MessageCommonFilter.vue';
import MessageList from './components/MessageList.vue';
import IconLink from '@/components/IconLink.vue';

import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';

import { useUserInfoStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import { EmptyTip, EventSourceNames, EventSources } from '@/data/event';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages, filterByRule } from '@/api/api-messages';

const userInfoStore = useUserInfoStore();
const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const unreadCountStore = useUnreadMsgCountStore();

const messages = ref<MessageT[]>([]);
dayjs.locale(locale.value);

const total = ref(0);
const pageInfo = reactive({
  page: 1,
  count_per_page: 10,
});

let timeoutId: ReturnType<typeof setTimeout>;

const showNoEmail = ref(false);

const goBindUserInfo = () => (window.location.href = import.meta.env.VITE_LOGIN_URL);

let lastQueryType: 'inner' | 'quick' = 'inner';
let lastQueryParams: { source: string; mode_name: string } | Record<string, any>;
let lastFilterName: string;

const onPageChange = () => {
  if (lastQueryType === 'quick') {
    applyQuickFilter(lastFilterName);
  } else {
    getData(lastQueryParams);
  }
};

onMounted(() => {
  if (!userInfoStore.email) {
    showNoEmail.value = true;
    return;
  }
});

/** 当前事件源 */
const source = computed(() => decodeURIComponent(route.query.source as string));
const filterPopupWidth = computed(() => (source.value === EventSources.CVE ? '480px' : '450px'));
const filterRef = ref<InstanceType<typeof MessageCommonFilter>>();
const filterVisible = ref();
const noMessageDesc = computed(() => {
  if (filterRef.value?.isFiltering) {
    return '没有匹配的消息';
  }
  return EmptyTip[source.value];
});

// ----------------时间范围----------------
const current = dayjs();
const timeOptions = [
  { label: '至今', value: '' },
  { label: '近一月', value: current.subtract(1, 'month').valueOf() },
  { label: '近一周', value: current.subtract(7, 'day').valueOf() },
];
const startTime = ref<number>();

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

let abortController: AbortController | null;

/** 快捷筛选 */
const applyQuickFilter = async (mode_name: string) => {
  lastQueryType = 'quick';
  lastFilterName = mode_name;
  if (source.value === EventSources.GITEE && !userInfoStore.giteeLoginName) {
    total.value = 0;
    messages.value = [];
    return;
  }
  if (abortController) {
    abortController.abort();
  }
  clearTimeout(timeoutId);
  abortController = new AbortController();
  let canceled = false;
  try {
    const res = await filterByRule(
      {
        source: source.value,
        mode_name,
        page: pageInfo.page,
        count_per_page: pageInfo.count_per_page,
      },
      abortController
    );
    const { count, query_info } = res.data;
    total.value = count;
    messages.value = query_info ?? [];
    unreadCountStore.updateCount();
  } catch (err) {
    total.value = 0;
    messages.value = [];
    canceled = err instanceof AxiosError && err.code === 'ERR_CANCELED';
  }
  abortController = null;
  if (!canceled) {
    timeoutId = setTimeout(() => applyQuickFilter(mode_name), 10000);
  }
};

// ------------------------切换已读未读消息------------------------
const readStatus = ref('');
const readStatusOptions = ref([
  { value: '', label: '全部' },
  { value: '0', label: '未读' },
]);

// ------------------------获取数据------------------------
const getData = async (filterParams: Record<string, any> = {}) => {
  lastQueryParams = filterParams;
  lastQueryType = 'inner';
  if (source.value === EventSources.GITEE && !userInfoStore.giteeLoginName) {
    total.value = 0;
    messages.value = [];
    return;
  }
  if (abortController) {
    abortController.abort();
  }
  clearTimeout(timeoutId);
  abortController = new AbortController();
  let canceled = false;
  try {
    const res = await getMessages(
      {
        source: source.value,
        is_read: readStatus.value,
        start_time: startTime.value?.toString(),
        page: pageInfo.page,
        count_per_page: pageInfo.count_per_page,
        ...filterParams,
      },
      abortController
    );
    const { count, query_info } = res.data;
    total.value = count;
    messages.value = query_info ?? [];
    unreadCountStore.updateCount();
  } catch (err) {
    total.value = 0;
    messages.value = [];
    canceled = err instanceof AxiosError && err.code === 'ERR_CANCELED';
  }
  abortController = null;
  if (!canceled) {
    timeoutId = setTimeout(() => getData(filterParams), 10_000);
  }
};

// ------------------------菜单事件------------------------
const activeMenu = ref(EventSources.EUR);

const onMenuChange = (source: string) => {
  pageInfo.page = 1;
  router.push({
    path: '/',
    query: { source: encodeURIComponent(source) },
  });
};

// ------------------------监听路由改变------------------------
watch(
  source,
  (val) => {
    messageListRef.value?.clearCheckboxes();
    if (val && val !== activeMenu.value) {
      activeMenu.value = val;
    }
    getData();
  },
  { immediate: true }
);

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
    deleteMessages(msg)
      .then(() => {
        message.success({ content: '删除成功' });
        getData();
        messageListRef.value?.clearCheckboxes();
      })
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
    deleteMessages(...messages.value.filter((item) => set.has(item.id)))
      .then(() => {
        if (set.size > 1) {
          message.success({ content: '批量删除成功' });
        } else {
          message.success({ content: '删除成功' });
        }
        messageListRef.value?.clearCheckboxes();
        getData();
      })
      .catch((error) => {
        if (error?.response?.data?.message) {
          message.warning(error.response.data.message);
        }
      });
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
  <ContentWrapper class="msg-list">
    <ConfirmDialog title="未绑定邮箱" content="请绑定邮箱" v-model:show="showNoEmail" @confirm="goBindUserInfo" confirm-text="前往绑定"></ConfirmDialog>
    <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />
    <div class="messages-part">
      <aside>
        <div class="title">消息中心</div>
        <OMenu v-model="activeMenu" @change="onMenuChange">
          <OMenuItem v-for="(url, source) in EventSources" :key="source" class="menu-item" :value="url">
            <p style="display: flex; justify-content: space-between">
              {{ EventSourceNames[url] }}
              <OBadge
                style="display: flex; align-items: center"
                color="danger"
                v-if="unreadCountStore.sourceCountMap.get(url) && (source !== 'GITEE' || userInfoStore.giteeLoginName)"
                :value="unreadCountStore.sourceCountMap.get(url)"
              >
              </OBadge>
            </p>
          </OMenuItem>
        </OMenu>
      </aside>

      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="checkAllVal" :indeterminate="indeterminate" style="--checkbox-label-gap: 28px" :disabled="!messages.length" :value="1">
              {{ checkboxVal.length ? `已选 ${checkboxVal.length} 条消息` : '全选' }}
            </OCheckbox>
            <template v-if="!checkboxVal.length">
              <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
              <RadioToggle v-model="readStatus" @change="getData()" :options="readStatusOptions" />
              <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
              <RadioToggle v-model="startTime" @change="getData()" :options="timeOptions" />
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
            <template v-else>
              <OPopup v-model:visible="filterVisible" trigger="click" position="br" :unmount-on-hide="false">
                <template #target>
                  <OLink style="--link-color-hover: var(--o-color-primary1)">
                    筛选
                    <template #icon><OIconFilter style="font-size: 24px" /></template>
                  </OLink>
                </template>
                <ContentWrapper
                  vertical-padding="24px"
                  :style="{
                    'border-radius': '4px',
                    'box-shadow': 'var(--o-shadow-2)',
                    width: filterPopupWidth,
                    'background-color': 'var(--o-color-fill2)',
                    '--layout-content-padding': '16px',
                  }"
                >
                  <MessageCommonFilter ref="filterRef" @apply-quick-filter="applyQuickFilter" @applyFilter="getData" />
                </ContentWrapper>
              </OPopup>
            </template>
          </div>
        </div>
        <!-- 消息列表 -->
        <MessageList
          v-if="total > 0 && (source !== EventSources.GITEE || userInfoStore.giteeLoginName)"
          ref="messageListRef"
          :messages="messages"
          @delete-message="delMessage"
          @read-message="markReadMessage"
          v-model:checkboxes="checkboxVal"
        />
        <div v-else class="no-messages">
          <img src="@/assets/svg-icons/icon-no-messages.svg" />
          <p>{{ noMessageDesc }}</p>
          <p v-if="source === EventSources.GITEE && !userInfoStore.giteeLoginName">
            接收Gitee消息，请<OLink
              style="--link-color: var(--o-color-primary1); font-weight: bold; --link-color-hover: rgb(var(--o-kleinblue-4))"
              @click="goBindUserInfo"
              >绑定Gitee账号</OLink
            >
          </p>
        </div>
      </div>
    </div>
    <AppPagination v-if="total > 0" :total="total" @change="onPageChange" v-model:page="pageInfo.page" v-model:pageSize="pageInfo.count_per_page" />
  </ContentWrapper>
</template>

<style scoped lang="scss">
:deep(.o-menu-item-content) {
  width: 100%;
}

:deep(.message-delete-read) {
  @include text1;
}

.icon-search {
  cursor: pointer;
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
  --menu-item-radius: 4px;
  --menu-item-bg-color-selected: rgb(var(--o-kleinblue-2));
  --menu-item-bg-color-hover: rgb(var(--o-kleinblue-1));
  --menu-item-color-selected: rgb(var(--o-kleinblue-6));
  @include text1;
}

.msg-list {
  min-height: var(--layout-content-min-height);
  margin-top: 64px;
  margin-bottom: 72px;
}

.messages-part {
  display: flex;
  min-height: var(--layout-content-min-height);

  & > :last-child {
    margin-left: 32px;
    flex-grow: 1;
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
  background-color: var(--o-color-fill2);
  padding: 28px 24px;
  gap: 10px;

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

    @include respond-to('phone') {
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
  height: 500px;
  color: var(--o-color-info3);
  @include text1;

  @include respond-to('phone') {
    height: 100vh;
  }

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
