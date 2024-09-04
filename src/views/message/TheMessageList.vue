<script setup lang="ts">
import { computed, inject, onBeforeMount, onMounted, onUnmounted, provide, reactive, ref, watch, watchEffect, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import {
  OCheckbox,
  OMenu,
  OMenuItem,
  useMessage,
  OPopover,
  OLink,
  ODivider,
  OIcon,
  OPopup,
} from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';

import { EventSourceNames, EventSources } from '@/data/event';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, getRepoList, getAllSigs, readMessages, filterByRule } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useLoginStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import AppPagination from '@/components/AppPagination.vue';
import { usePhoneStore } from '@/stores/phone';
import MessageListFilterDlg from './components/MessageListFilterDlg.vue';
import { getAllSubs, getFilterRules } from '@/api/api-settings';
import ContentWrapper from '@/components/ContentWrapper.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import MessageCommonFilter from './components/MessageCommonFilter.vue';

const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const loginStore = useLoginStore();
const dateTime = dayjs();

const settingsIcon = ref();
const messages = ref<MessageT[]>([]);
dayjs.locale(locale.value);
const showTipPopOver = ref(false);

const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

watch([() => pageInfo.page, () => pageInfo.pageSize], () => {

});

watchEffect(() => {
  if (loginStore.isLogined) {
    const showTipCount = Number(sessionStorage.getItem('showTipCount') ?? '0');
    if (Number(showTipCount) < 1) {
      showTipPopOver.value = true;
      sessionStorage.setItem('showTipCount', (showTipCount + 1).toString());
    }
  }
});

const isPhone = inject<Ref<boolean>>('isPhone');
provide('isPhone', isPhone);
let intervalId: ReturnType<typeof setInterval>;

let lastPollType: 'inner' | 'quick' = 'inner';
let lastQueryRule: any;

onMounted(() => {
  getData();
  intervalId = setInterval(() => {
    if (lastPollType === 'inner') {
      getData();
    } else {
      selectRule(lastQueryRule);
    }
  }, 10_000);
});

onUnmounted(() => clearInterval(intervalId));

const timeOptions = [
  { label: '全部', value: 'all' },
  { label: '近一周', value: 'week' },
  { label: '近一月', value: 'month' },
];

const timeRangeChange = (val: string) => {
  if (val === 'all') {
    filterParams.start_time = '';
    filterParams.end_time = '';
  } else if (val === 'week') {
    filterParams.start_time = dateTime.subtract(7, 'day').valueOf();
    filterParams.end_time = dateTime.valueOf();
  } else if (val === 'month') {
    filterParams.start_time = dateTime.subtract(1, 'month').valueOf();
    filterParams.end_time = dateTime.valueOf();
  }
  getData();
};

const applyQuickFilter = (mode_name: string) => selectRule({ source: route.query.source as string, mode_name });

const filterRef = ref<InstanceType<typeof MessageCommonFilter>>();

const filterPopupVisibleChange = (visible: boolean) => {
  if (!visible) {
    getData(filterRef.value?.getFilterParams());
  }
};

// ------------------------多选框事件------------------------
const {
  checkboxes,
  parentCheckbox,
  indeterminate,
  isCheckedAll,
  checkAll,
  clearCheckboxes,
} = useCheckbox(messages, (msg) => msg.id);
provide('checkboxes', checkboxes);

// ------------------------消息过滤------------------------
const filterParams = reactive<Record<string, string | number>>({
  source: '',
  event_type: '',
  is_read: '',
  key_word: '',
  is_bot: '',
  is_special: '',
  sig: '',
  repos: '',
  count_per_page: 10,
  page: 1,
  start_time: '',
  end_time: '',
  build_env: '',
  meeting_start_time: '',
  meeting_end_time: '',
  meeting_action: '',
  meeting_sig: '',
  pr_state: '',
  pr_creator: '',
  pr_assignee: '',
  issue_state: '',
  issue_creator: '',
  issue_assignee: '',
  build_status: '',
  build_creator: '',
  build_owner: '',
  note_type: '',
  about: '',
  my_sig: '',
  my_management: '',
  cve_component: '',
  cve_state: '',
  cve_affected: '',
});

const lastFilterParams = ref<Record<string, any>>({});

const rules = ref<{ source: string, mode_name: string, id: string }[]>([]);

const showDlg = ref(false);

watch(
  showDlg,
  (val) => {
    if (val) {
      getAllSubs()
        .then((data) => {
          rules.value = data.map((item) => ({
            source: item.source,
            mode_name: item.mode_name,
            id: item.id
          }));
        })
    }
  }
);

const selectRule = (val: { source: string, mode_name: string }) => {
  if (val) {
    lastPollType = 'quick';
    lastQueryRule = val;
    filterByRule({
      source: val.source,
      mode_name: val.mode_name,
      page: filterParams.page as number,
      count_per_page: filterParams.count_per_page as number,
    }).then((res) => {
      const { count, query_info } = res.data;
      pageInfo.total = count;
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
  }
};

// ------------------------gitee的sig和Repos------------------------
const allSigReposMap = new Map<string, string[]>();

const sigList = ref<string[]>([]);
const repoList = ref<string[]>([]);
const repoRenderList = ref<string[]>([]);

const onGiteeSigChange = (val: (string | number)[]) => {
  filterParams.sig = val.join();
  getData();
  if (!val.length) {
    repoRenderList.value = repoList.value;
    return;
  };
  repoRenderList.value = val.reduce((list, current) => {
    list.push(...(allSigReposMap.get(current as string) ?? []));
    return list;
  }, [] as string[]);
};

const onRepoChange = (val: (string | number)[]) => {
  filterParams.repos = val.join();
  getData();
};


// ------------------------获取数据------------------------
const getData = (filterParams: Record<string, any> = {}) => {
  lastPollType = 'inner';
  lastFilterParams.value = filterParams;
  getMessages({
    page: pageInfo.page,
    count_per_page: pageInfo.pageSize,
    source: route.query.source as string,
    ...lastFilterParams.value,
  })
    .then((res) => {
      const { count, query_info } = res.data;
      pageInfo.total = count;
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
    .catch(() => {
      pageInfo.total = 0;
    })
};

// ------------------------菜单事件------------------------
const activeMenu = ref(EventSources.EUR);

const onMenuChange = (source: string) => {
  // 清空过滤
  filterRef.value?.reset();
  if (source === 'all') {
    router.push({ path: '/' });
  } else {
    router.push({
      path: '/',
      query: { source },
    });
  }
};

// ------------------------监听路由改变------------------------
watch(
  () => route.query,
  () => {
    const { source } = route.query;
    if (source && source !== activeMenu.value) {
      activeMenu.value = source as string;
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
const readStatus = ref('');
const readStatusOptions = ref([
  { value: '', label: '全部' },
  // { value: '1', label: '已读消息' },
  { value: '0', label: '未读' },
]);

watch(readStatus, (val: string | number) => {
  filterParams.is_read = val as string;
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
    if (val && !isCheckedAll.value) {
      checkAll();
      return;
    }
    if (!val && isCheckedAll.value) {
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

const phoneFilterConfirm = (source: string) => {
  if (!source) {
    router.push({ path: '/' });
    return;
  }
  router.push({ path: '/', query: { source } });
};

onBeforeMount(() => {
  getRepoList()
    .then((data) => {
      repoList.value = data;
      repoRenderList.value = data;
    });
  getAllSigs().then(data => {
    sigList.value = data.map((item) => item.sig_name);
    for (const item of data) {
      allSigReposMap.set(item.sig_name, item.repos);
    }
  });
});
</script>

<template>
  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />

  <!-- 移动端特有弹窗 -->
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="phoneFilterConfirm"></MessageListFilterDlg>

  <!-- 移动端特有弹窗 -->
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="phoneFilterConfirm"></MessageListFilterDlg>

  <div class="messages-container">
    <aside v-if="!isPhone">
      <div class="title">
        消息中心
        <OPopover :target="settingsIcon" :visible="showTipPopOver" trigger="none">
          <div class="first-time-login-tip">
            <p>可在消息订阅管理中订阅你所关注的消息</p>
            <OLink variant="text" @click="showTipPopOver = false">知道了</OLink>
          </div>
        </OPopover>
      </div>
      <OMenu v-model="activeMenu" @change="onMenuChange">
        <OMenuItem v-for="(url, source) in EventSources" :key="source" class="menu-item" :value="url"> {{ EventSourceNames[url] }} </OMenuItem>
      </OMenu>
    </aside>

    <div class="message-list-wrap">
      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="parentCheckbox" :indeterminate="indeterminate" :value="1">全选</OCheckbox>
            <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
            <RadioToggle v-model="filterParams.is_read" :options="readStatusOptions" />
            <ODivider direction="v" style="--o-divider-label-gap: 0; height: 100%"></ODivider>
            <RadioToggle @change="timeRangeChange" :options="timeOptions" />
          </div>
          <div class="right" :disabled="checkboxes.length === 0">
            <OPopup trigger="click" position="br" @change="filterPopupVisibleChange" :unmount-on-hide="false">
              <template #target>
                <p style="cursor: pointer;">筛选</p>
              </template>
              <ContentWrapper vertical-padding="24px" style="border-radius: 4px; box-shadow: var(--o-shadow-2); width: 450px; background-color: var(--o-color-fill2); --layout-content-padding: 16px">
                <MessageCommonFilter ref="filterRef" :source="(route.query.source as string)" @quick-fiter="applyQuickFilter" />
              </ContentWrapper>
            </OPopup>
            <OLink v-if="isPhone && !phoneStore.isManaging" color="primary" @click="phoneStore.isManaging = true"> 管理 </OLink>
          </div>
        </div>
        <template v-if="pageInfo.total > 0">
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
  <AppPagination v-if="!isPhone && pageInfo.total > 0" topMargin="40px" :total="pageInfo.total" v-model:page="pageInfo.page" v-model:pageSize="pageInfo.pageSize" />
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
