<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, provide, reactive, ref, watch, watchEffect, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import {
  OCheckbox,
  OMenu,
  OMenuItem,
  useMessage,
  OSelect,
  OOption,
  OPopover,
  OLink,
  ODivider,
  OIcon,
  OInput,
  type SelectValueT,
  OTab,
  OTabPane,
} from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';
import IconSettings from '~icons/app/icon-setting.svg';
import IconSearch from '~icons/app/icon-search.svg';

import { EUR_BUILD_STATUS, EventSourceNames, EventSources } from '@/data/event';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useLoginStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import IconLink from '@/components/IconLink.vue';
import AppPagination from '@/components/AppPagination.vue';
import { usePhoneStore } from '@/stores/phone';
import MessageListFilterDlg from './components/MessageListFilterDlg.vue';

const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const loginStore = useLoginStore();

const settingsIcon = ref();
const messages = ref<MessageT[]>([]);
dayjs.locale(locale.value);
const showTipPopOver = ref(false);

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

watchEffect(() => {
  if (loginStore.isLogined) {
    const showTipCount = Number(sessionStorage.getItem('showTipCount') ?? '0');
    if (Number(showTipCount) < 1) {
      showTipPopOver.value = true;
      sessionStorage.setItem('showTipCount', (showTipCount + 1).toString());
    }
  }
});

const toConfig = () => router.push('/settings');

const isPhone = inject<Ref<boolean>>('isPhone');
provide('isPhone', isPhone);
let timeoutId: ReturnType<typeof setTimeout>;

onMounted(() => {
  timeoutId = setTimeout(getData, 10_000);
});

onUnmounted(() => clearTimeout(timeoutId));

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

// ------------------------搜索------------------------
const searchInput = ref('');

const searchPlaceholder = computed(() => {
  switch (route.query.source) {
    case EventSources.EUR:
      return '项目';
    case EventSources.GITEE:
      return '仓库';
    default:
      return '项目/仓库';
  }
});

// ------------------------消息过滤下拉多选------------------------
const msgFilterSelectVal = ref<string[]>([]);

const msgFilterSelectPlaceholder = computed(() => {
  switch (route.query.source) {
    case EventSources.EUR:
      return '构建状态';
    case EventSources.GITEE:
      return '是否机器人';
    default:
      return '';
  }
});

const msgFilterSelectOptions = computed(() => {
  switch (route.query.source) {
    case EventSources.EUR:
      return EUR_BUILD_STATUS;
    case EventSources.GITEE:
      return [
        { value: 'true', label: '机器人' },
        { value: 'false', label: '非机器人' },
      ];
    default:
      return [];
  }
});

const onFilterSelectChange = () => nextTick(getData);

// ------------------------gitee消息类型过滤下拉多选------------------------
const giteeEventType = ref<string[]>([]);

const giteeEventTypeOptions = [
  { value: 'push', label: 'Push' },
  { value: 'pr', label: 'Pull Request' },
  { value: 'issue', label: 'Issue' },
  { value: 'note', label: '评论' },
];

const onGiteeEventTypeChange = (val: SelectValueT) => {
  const types = val as string[];
  router.push({
    path: '/',
    query: {
      source: EventSources.GITEE,
      event_type: types.length ? types.join() : undefined,
    },
  });
};

// ------------------------是否特别关注消息------------------------
const isSpecial = ref<'true' | ''>('true');

watch(isSpecial, () => {
  if (page.value === 1) {
    getData();
  } else {
    page.value = 1;
  }
});

// ------------------------获取数据------------------------
const isRead = ref<0 | 1 | undefined>();

const getData = () => {
  const { source, event_type } = route.query;
  const filterValues = msgFilterSelectVal.value.length ? msgFilterSelectVal.value.join() : undefined;
  getMessages({
    source: source as string,
    event_type: event_type as string,
    is_read: isRead.value,
    page: page.value,
    count_per_page: pageSize.value,
    key_word: searchInput.value || undefined,
    build_status: source === EventSources.EUR ? filterValues : undefined,
    is_bot: source === EventSources.GITEE ? filterValues : undefined,
    is_special: isSpecial.value,
  })
    .then((res) => {
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
    })
};

watch([page, pageSize], () => getData());

// ------------------------菜单事件------------------------
const activeMenu = ref('all');

const onMenuChange = (menu: string) => {
  if (menu === 'all') {
    router.push({ path: '/' });
  } else {
    // 清空过滤
    if (msgFilterSelectVal.value.length) {
      msgFilterSelectVal.value = [];
    }
    // 清空gitee消息类型过滤
    if (giteeEventType.value.length) {
      giteeEventType.value = [];
    }
    router.push({
      path: '/',
      query: {
        source: menu,
        event_type: menu === EventSources.EUR ? 'build' : giteeEventType.value.join(),
      },
    });
  }
};

watch(
  () => route.query,
  () => {
    if (page.value !== 1) {
      page.value = 1;
    } else {
      getData();
    }
    const { source, event_type } = route.query;
    if (source && source !== activeMenu.value) {
      activeMenu.value = source as string;
    } else if (!source && activeMenu.value !== 'all') {
      activeMenu.value = 'all';
    }
    if (event_type) {
      switch (source) {
        case EventSources.GITEE:
          giteeEventType.value = (event_type as string).split(',');
          break;
      }
    }
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
  if (checkboxes.value.length === 0) {
    return;
  }
  const set = new Set(checkboxes.value);
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
        checkboxes.value = [];
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
  if (checkboxes.value.length === 0) {
    return;
  }
  const set = new Set(checkboxes.value);
  readMessages(...messages.value.filter((item) => set.has(item.id)))
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

watch(checkboxes, (val) => {
  phoneStore.checkedCount = val.length;
});

watch(
  () => phoneStore.isManaging,
  (val) => {
    if (!val) {
      clearCheckboxes();
    }
  }
);

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

const filterConfirm = (source: string, event_type: string) => {
  if (!source && !event_type) {
    router.push({ path: '/' });
    return;
  }
  router.push({ path: '/', query: { source, event_type } });
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
          <template #suffix><IconSettings /></template>
        </IconLink>
        <OPopover :target="settingsIcon" :visible="showTipPopOver" trigger="none">
          <div class="first-time-login-tip">
            <p>可在消息订阅管理中订阅你所关注的消息</p>
            <OLink variant="text" @click="showTipPopOver = false">知道了</OLink>
          </div>
        </OPopover>
      </div>
      <OMenu v-model="activeMenu" @change="onMenuChange">
        <OMenuItem class="menu-item" value="all"> 全部 </OMenuItem>
        <OMenuItem v-for="(url, source) in EventSources" :key="source" class="menu-item" :value="url"> {{ EventSourceNames[url] }} </OMenuItem>
      </OMenu>
    </aside>

    <div class="message-list-wrap">
      <OTab variant="text" :line="false" v-model="isSpecial">
        <OTabPane label="特别关注消息" value="true"></OTabPane>
        <OTabPane label="全部消息" value=""></OTabPane>
      </OTab>
      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="parentCheckbox" :indeterminate="indeterminate" :value="1"></OCheckbox>
            <!-- 已读状态筛选 -->
            <OSelect class="select" v-model="readStatus" variant="text" style="width: 112px">
              <OOption class="select-option" v-for="item in readStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
            <template v-if="!isPhone && activeMenu !== 'all'">
              <!-- 仓库/项目名称搜索框 -->
              <OInput v-model="searchInput" @pressEnter="getData" :placeholder="searchPlaceholder">
                <template #suffix>
                  <div style="display: flex">
                    <IconSearch class="icon-search" @click="getData" />
                  </div>
                </template>
              </OInput>
              <!-- 通用过滤下拉选择 -->
              <OSelect :multiple="true" v-model="msgFilterSelectVal" @change="onFilterSelectChange" :placeholder="msgFilterSelectPlaceholder">
                <OOption v-for="item in msgFilterSelectOptions" :key="item.value" :value="item.value" :label="item.label">
                  {{ item.label }}
                </OOption>
              </OSelect>
              <!-- gitee消息类型下拉选择 -->
              <OSelect
                v-if="route.query.source === EventSources.GITEE"
                :multiple="true"
                v-model="giteeEventType"
                placeholder="消息类型"
                @change="onGiteeEventTypeChange"
              >
                <OOption v-for="item in giteeEventTypeOptions" :key="item.value" :value="item.value" :label="item.label">
                  {{ item.label }}
                </OOption>
              </OSelect>
            </template>
          </div>
          <div class="right" :disabled="checkboxes.length === 0">
            <template v-if="!isPhone">
              <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="checkboxes.length === 0" @click="delMultiMessages">
                <template #prefix><IconDelete /></template>
                删除
              </IconLink>
              <IconLink :label-class-names="['message-delete-read']" iconSize="20px" :disabled="multiReadDisabled" @click="markReadMultiMessages">
                <template #prefix><IconRead /></template>
                标记已读
              </IconLink>
            </template>
            <OLink v-else-if="!phoneStore.isManaging" color="primary" @click="phoneStore.isManaging = true"> 管理 </OLink>
          </div>
        </div>
        <template v-if="total > 0">
          <!-- 消息列表 -->
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
          <div style="height: 62px"></div>
          <Teleport to="body">
            <div class="phone-footer">
              <div @click="markReadMultiMessages">
                <OIcon class="icon"><IconRead /></OIcon>
                <p>标为已读</p>
              </div>
              <div @click="delMultiMessages">
                <OIcon class="icon"><IconDelete /></OIcon>
                <p>删除</p>
              </div>
            </div>
          </Teleport>
        </template>
      </div>
    </div>
  </div>
  <AppPagination v-if="!isPhone && total > 0" topMargin="40px" :total="total" v-model:page="page" v-model:pageSize="pageSize" />
</template>

<style scoped lang="scss">
:deep(.message-delete-read) {
  @include tip1;
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

.messages-container {
  display: flex;
  max-width: 1418px;
  min-height: 60vh;
  margin-top: 64px;

  & > :last-child {
    margin-left: 32px;
    height: 100%;
    flex-grow: 1;

    @include respond-to('phone') {
      margin-top: var(--layout-header-height);
      margin-left: 0;
    }
  }

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
  // flex-grow: 1;
  background-color: var(--o-color-fill2);
  padding: 16px;
  // height: 100%;
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
