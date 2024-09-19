<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, provide, reactive, ref, watch, watchEffect, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OMenu, OMenuItem, useMessage, OLink, ODivider, OIcon, OPopup, OBadge, OIconFilter } from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';

import { EmptyTip, EventSourceNames, EventSources } from '@/data/event';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages, filterByRule } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useLoginStore, useUserInfoStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import AppPagination from '@/components/AppPagination.vue';
import { usePhoneStore } from '@/stores/phone';
// import MessageListFilterDlg from './components/MessageListFilterDlg.vue';
import ContentWrapper from '@/components/ContentWrapper.vue';
import RadioToggle from '@/components/RadioToggle.vue';
import MessageCommonFilter from './components/MessageCommonFilter.vue';
import IconLink from '@/components/IconLink.vue';
import { windowOpen } from '@/utils/common';

const userInfoStore = useUserInfoStore();
const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const { isRevealed, reveal, confirm, cancel } = useConfirmDialog();
const loginStore = useLoginStore();
const unreadCountStore = useUnreadMsgCountStore();

const messages = ref<MessageT[]>([]);
dayjs.locale(locale.value);
const showTipPopOver = ref(false);

const total = ref(0);
const pageInfo = reactive({
  page: 1,
  count_per_page: 10,
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

const showNoEmail = ref(false);

const goBindUserInfo = () => windowOpen('https://id.openeuler.org/zh/profile');

onMounted(() => {
  if (!userInfoStore.email) {
    showNoEmail.value = true;
    return;
  }
  intervalId = setInterval(() => {
    if (lastPollType === 'inner') {
      getData(lastFilterParams.value);
    } else {
      selectRule(lastQueryRule);
    }
  }, 10_000);
});

onUnmounted(() => clearInterval(intervalId));

/** 当前事件源 */
const source = computed(() => decodeURIComponent(route.query.source as string));

const filterPopupWidth = computed(() => (source.value === EventSources.CVE ? '480px' : '450px'));

// ----------------时间范围----------------
const current = dayjs();
const timeOptions = [
  { label: '至今', value: '' },
  { label: '近一月', value: current.subtract(1, 'month').valueOf() },
  { label: '近一周', value: current.subtract(7, 'day').valueOf() },
];
const startTime = ref<number>();

const applyQuickFilter = (mode_name: string) => selectRule({ source: source.value, mode_name });

const filterRef = ref<InstanceType<typeof MessageCommonFilter>>();

// ------------------------多选框事件------------------------
const { checkAllVal, checkboxVal, indeterminate, clearCheckboxes } = useCheckbox(messages, (msg) => msg.id);
provide('checkboxVal', checkboxVal);

const lastFilterParams = ref<Record<string, any>>({});

const selectRule = (val: { source: string; mode_name: string }) => {
  if (val) {
    lastPollType = 'quick';
    lastQueryRule = val;
    filterByRule({
      source: val.source,
      mode_name: val.mode_name,
      page: pageInfo.page as number,
      count_per_page: pageInfo.count_per_page as number,
    }).then((res) => {
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
  }
};

// ------------------------切换已读未读消息------------------------
const readStatus = ref('');
const readStatusOptions = ref([
  { value: '', label: '全部' },
  { value: '0', label: '未读' },
]);

// ------------------------获取数据------------------------
const getData = (filterParams: Record<string, any> = {}) => {
  lastPollType = 'inner';
  lastFilterParams.value = filterParams;
  getMessages({
    source: source.value,
    is_read: readStatus.value,
    start_time: startTime.value,
    ...pageInfo,
    ...lastFilterParams.value,
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
      messages.value = query_info ?? [];
    })
    .catch(() => {
      total.value = 0;
    });
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
      query: { source: encodeURIComponent(source) },
    });
  }
};

// ------------------------监听路由改变------------------------
watch(
  source,
  (val) => {
    clearCheckboxes();
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
        clearCheckboxes();
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
        clearCheckboxes();
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
  readMessages(...messages.value.filter((item) => set.has(item.id)))
    .then(() => {
      getData();
      unreadCountStore.updateCount();
      clearCheckboxes();
    })
    .catch((error) => {
      if (error?.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    });
};

// ------------------------移动端------------------------
const phoneStore = usePhoneStore();

watch(checkboxVal, (val) => {
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

/* watch(
  () => phoneStore.checkedAll,
  (val) => {
    if (val && !isCheckedAll.value) {
      checkAll();
      return;
    }
    if (!val && isCheckedAll.value) {
      clearcheckboxVal();
    }
  }
); */

/* watch(isCheckedAll, (val) => {
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
}; */
</script>

<template>
  <ConfirmDialog title="未绑定邮箱" content="请绑定邮箱" v-model:show="showNoEmail" @confirm="goBindUserInfo" confirm-text="前往绑定"></ConfirmDialog>

  <ConfirmDialog :title="confirmDialogOptions.title" :content="confirmDialogOptions.content" :show="isRevealed" @confirm="confirm" @cancel="cancel" />

  <!-- 移动端特有弹窗 -->
  <!-- <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="phoneFilterConfirm"></MessageListFilterDlg> -->

  <!-- 移动端特有弹窗 -->
  <!-- <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="phoneFilterConfirm"></MessageListFilterDlg> -->

  <div class="messages-container">
    <aside v-if="!isPhone">
      <div class="title">消息中心</div>
      <OMenu v-model="activeMenu" @change="onMenuChange">
        <OMenuItem v-for="(url, source) in EventSources" :key="source" class="menu-item" :value="url">
          <p style="display: flex; justify-content: space-between">
            {{ EventSourceNames[url] }}
            <OBadge color="danger" v-if="unreadCountStore.sourceCountMap.get(url)" :value="unreadCountStore.sourceCountMap.get(url)"> </OBadge>
          </p>
        </OMenuItem>
      </OMenu>
    </aside>

    <div class="message-list-wrap">
      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="checkAllVal" :indeterminate="indeterminate" :value="1">
              {{ checkboxVal.length ? `已选${checkboxVal.length}条消息` : '全选' }}
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
              <IconLink :label-class-names="['message-delete-read']" iconSize="20px" @click="markReadMultiMessages">
                <template #prefix><IconRead /></template>
                标记已读
              </IconLink>
              <IconLink :label-class-names="['message-delete-read']" hover-color="var(--o-color-danger1)" iconSize="20px" @click="delMultiMessages">
                <template #prefix><IconDelete /></template>
                删除
              </IconLink>
            </template>
            <template v-else>
              <OPopup trigger="click" position="br" :unmount-on-hide="false">
                <template #target>
                  <OLink style="--link-color-hover: var(--o-color-primary1)">
                    筛选
                    <template #icon>
                      <OIcon style="width: 20px; font-size: 20px;"><OIconFilter /></OIcon>
                    </template>
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
                  <MessageCommonFilter ref="filterRef" @apply-quick-filter="applyQuickFilter" @apply-filter="getData" />
                </ContentWrapper>
              </OPopup>
            </template>
            <!-- <OLink v-if="isPhone && !phoneStore.isManaging" color="primary" @click="phoneStore.isManaging = true"> 管理 </OLink> -->
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
          <p>{{ EmptyTip[source] }}</p>
          <p v-if="source === EventSources.GITEE && !userInfoStore.giteeLoginName">
            接收Gitee消息，请<OLink style="--link-color: var(--o-color-primary1); font-weight: bold" @click="goBindUserInfo">绑定Gitee账号</OLink>
          </p>
        </div>

        <!-- <template v-if="isPhone && phoneStore.isManaging">
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
        </template> -->
      </div>
    </div>
  </div>
  <AppPagination v-if="!isPhone && total > 0" topMargin="40px" :total="total" v-model:page="pageInfo.page" v-model:pageSize="pageInfo.count_per_page" />
</template>

<style scoped lang="scss">
:deep(.o-menu-item-content) {
  width: 100%;
}

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
  --menu-item-radius: 4px;
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
      padding-left: 12px;

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
  font-size: 16px;
  color: var(--o-color-info3);

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
