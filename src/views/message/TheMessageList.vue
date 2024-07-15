<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';

import { OCheckbox, OCollapse, OCollapseItem, OMenu, OMenuItem, OPagination, OSubMenu, useMessage, OSelect, OOption } from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import MessagesOperation from './components/MessagesOperation.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

import { events } from '@/data/subscribeSettings';
import { eventDisplayNames } from '@/data/subscribeSettings';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages } from '@/api/messages';
import { useConfirmDialog } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';

const message = useMessage();
const { locale } = useI18n();
const router = useRouter();
const {
  isRevealed,
  reveal,
  confirm,
  cancel,
} = useConfirmDialog();

const expandedMenus = ref(events.map((_, index) => `${index}`));
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const thisWeekMessages = ref<MessageT[]>([]);
const aWeekAgoMessages = ref<MessageT[]>([]);
const collapseExpanded = ref([1, 2]);
const requestParams = reactive({
  source: '',
  eventType: '',
  isRead: undefined as 0 | 1 | undefined,
});
const confirmDialogOptions = reactive({
  title: '',
  content: '',
});
// const confirmDialog = ref<any>();

const NOW = dayjs();
dayjs.locale(locale.value);

const toConfig = () => router.push('/settings');

// ------------------------多选框事件------------------------
const thisWeekCheckboxOps = useCheckbox(thisWeekMessages, msg => msg.id);
const aWeekAgoCheckboxOps = useCheckbox(aWeekAgoMessages, msg => msg.id);
const checkedAll = ref<number[]>([]);
const checkedAllIndeterminate = ref(false);

const checkedItems = computed(() => thisWeekCheckboxOps.checkboxes.value.concat(aWeekAgoCheckboxOps.checkboxes.value));

watch([
  () => thisWeekCheckboxOps.parentCheckbox.value,
  () => aWeekAgoCheckboxOps.parentCheckbox.value,
], ([thisWeek, aWeekAgo]) => {
  if (thisWeek.length && aWeekAgo.length) {
    if (!checkedAll.value.length) {
      checkedAll.value = [1];
    }
    checkedAllIndeterminate.value = false;
  } else if (!thisWeek.length && !aWeekAgo.length) {
    if (checkedAll.value.length) {
      checkedAll.value = [];
    }
    checkedAllIndeterminate.value = false;
  } else {
    if (checkedAll.value.length) {
      checkedAll.value = [];
    }
    checkedAllIndeterminate.value = true;
  }
});

watch(checkedAll, val => {
  if (val.length) {
    if (!thisWeekCheckboxOps.parentCheckbox.value.length) {
      thisWeekCheckboxOps.setCheckAll();
    }
    if (!aWeekAgoCheckboxOps.parentCheckbox.value.length) {
      aWeekAgoCheckboxOps.setCheckAll();
    }
  } else {
    if (thisWeekCheckboxOps.parentCheckbox.value.length) {
      thisWeekCheckboxOps.clearCheckboxes();
    }
    if (aWeekAgoCheckboxOps.parentCheckbox.value.length) {
      aWeekAgoCheckboxOps.clearCheckboxes();
    }
  }
});

// ------------------------获取数据------------------------
const getData = (pageOption = { page: 1, pageSize: 10 }) => {
  getMessages(requestParams.source, requestParams.eventType, requestParams.isRead, pageOption.page, pageOption.pageSize).then(({ total: returnTotal, data }) => {
    thisWeekMessages.value = [];
    aWeekAgoMessages.value = [];
    thisWeekCheckboxOps.clearCheckboxes();
    aWeekAgoCheckboxOps.clearCheckboxes();
    total.value = returnTotal;
    for (const item of data) {
      item.formattedTime = dayjs(item.time).fromNow();
      const date = dayjs(item.time);
      if (NOW.diff(date, 'week') === 0) {
        thisWeekMessages.value.push(item);
      } else {
        aWeekAgoMessages.value.push(item);
      }
    }
  });
};
getData();

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
  getData();
});

// ------------------------删除消息------------------------
const delMessage = async (msg: MessageT) => {
  confirmDialogOptions.title = '删除消息';
  confirmDialogOptions.content = `是否确定删除1条消息`;
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    deleteMessages(msg).then(() => getData())
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
  const set = new Set(checkedItems.value);
  confirmDialogOptions.title = '删除消息';
  confirmDialogOptions.content = `是否确定删除${set.size}条消息`;
  const { isCanceled } = await reveal();
  if (!isCanceled) {
    const messages = [];
    messages.push(...thisWeekMessages.value.filter((item) => set.has(item.id)));
    messages.push(...aWeekAgoMessages.value.filter((item) => set.has(item.id)));
    deleteMessages(...messages)
      .then(() => {

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
  readMessages(msg).then(() => getData())
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
  const set = new Set(checkedItems.value);
  const messages = [];
  messages.push(...thisWeekMessages.value.filter((item) => set.has(item.id)));
  messages.push(...aWeekAgoMessages.value.filter((item) => set.has(item.id)));
  readMessages(...messages)
    .then(() => getData())
    .catch((error) => {
      if (error?.response?.data?.message) {
        message.warning(error.response.data.message);
      }
    });
};

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
  <ConfirmDialog 
    :title="confirmDialogOptions.title" 
    :content="confirmDialogOptions.content" 
    :show="isRevealed" 
    @confirm="confirm"
    @cancel="cancel"
  />
  <div class="messages-container">
    <aside>
      <div class="title">
        消息中心
        <div @click="toConfig">
          <img class="active" src="@/assets/svg-icons/icon-setting-active.svg" />
          <img class="inactive" src="@/assets/svg-icons/icon-setting.svg" />
        </div>
      </div>
      <OMenu v-model="activeMenu" :default-expanded="expandedMenus">
        <OMenuItem value="all"> 全部消息 </OMenuItem>
        <template v-for="(ev, index) in events" :key="ev.source + (ev.event_type ?? '')">
          <OMenuItem v-if="!ev.children" :value="`${ev.source}_${ev.event_type}`">
            {{ eventDisplayNames[ev.source][ev.event_type]() }}
          </OMenuItem>
          <OSubMenu v-else :value="`${index}`">
            <template #title>
              <p>{{ eventDisplayNames[ev.source].default() }}</p>
            </template>
            <OMenuItem v-for="child in ev.children" :key="child.event_type" :value="`${ev.source}_${child.event_type}`">
              {{ eventDisplayNames[ev.source][child.event_type]() }}
            </OMenuItem>
          </OSubMenu>
        </template>
      </OMenu>
    </aside>

    <div class="message-list">
      <template v-if="total > 0">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="checkedAll" :indeterminate="checkedAllIndeterminate" value="1"></OCheckbox>
            <OSelect v-model="selectedVal" variant="text">
              <OOption v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
          </div>
          <div class="right" :disabled="checkedItems.length === 0">
            <MessagesOperation type="delete" :disabled="checkedItems.length === 0" @perform="delMultiMessages" label="删除" />
            <MessagesOperation type="mark-read" :disabled="checkedItems.length === 0" @perform="markReadMultiMessages" label="标记已读" />
          </div>
        </div>
        <div class="list">
          <OCollapse v-model="collapseExpanded">
            <OCollapseItem :value="1">
              <template #title>
                <div style="display: flex; align-items: center; gap: 16px">
                  <OCheckbox
                    v-model="thisWeekCheckboxOps.parentCheckbox.value"
                    :indeterminate="thisWeekCheckboxOps.indeterminate.value"
                    :value="1"
                    @click.capture.stop>
                  </OCheckbox>
                  <span>本周</span>
                </div>
              </template>
              <div v-for="msg in thisWeekMessages" :key="msg.id" class="item">
                <div class="checkbox-wrapper">
                  <OCheckbox
                    :value="msg.id"
                    v-model="thisWeekCheckboxOps.checkboxes.value"
                  />
                </div>
                <MessageListItem :msg="msg" @deleteMessage="delMessage" @readMessage="markReadMessage"/>
              </div>
            </OCollapseItem>
            <OCollapseItem :value="2">
              <template #title>
                <div style="display: flex; align-items: center; gap: 16px">
                  <OCheckbox
                    v-model="aWeekAgoCheckboxOps.parentCheckbox.value"
                    :indeterminate="aWeekAgoCheckboxOps.indeterminate.value"
                    :value="1"
                    @click.capture.stop>
                  </OCheckbox>
                  <span>一周前</span>
                </div>
              </template>
              <template v-for="msg in aWeekAgoMessages" :key="msg.id">
                <div class="item">
                  <div class="checkbox-wrapper">
                    <OCheckbox
                      :value="msg.id"
                      v-model="aWeekAgoCheckboxOps.checkboxes.value"
                    />
                  </div>
                  <MessageListItem :msg="msg" @deleteMessage="delMessage" @readMessage="markReadMessage"/>
                </div>
              </template>
            </OCollapseItem>
          </OCollapse>
        </div>
      </template>
      <div v-else class="no-messages">
        <img src="@/assets/svg-icons/icon-no-messages.svg" />
        <p>暂无消息</p>
      </div>
    </div>
  </div>
  <OPagination :total="total" :page="currentPage" :pageSize="pageSize" show-total @change="getData" />
</template>

<style scoped lang="scss">
:deep(.o-collapse-item) {
  border: none;
}

:deep(.o-pagination-wrap) {
  justify-content: flex-end;
}

:deep(.o-collapse) {
  padding: 0%;
}

.dot-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 12px;
  background-color: transparent;

  &[show='true'] {
    background-color: #002ea7;
  }
}

.messages-container {
  display: flex;
  gap: 32px;
  width: 80vw;
  min-height: 60vh;

  aside {
    .title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 32px;

      img {
        width: 24px;
        height: 24px;
      }

      div {
        font-size: 16px;
        white-space: nowrap;
        cursor: pointer;

        .active {
          display: none;
        }

        .inactive {
          display: inline;
        }

        &:hover {
          color: #002ea7;

          .active {
            display: inline;
          }

          .inactive {
            display: none;
          }
        }
      }
    }
  }
}

.message-list {
  flex-grow: 1;
  background-color: var(--o-color-fill2);
  padding: 24px;
  height: 100%;

  .header {
    display: flex;
    justify-content: space-between;

    .left {
      display: flex;
      align-items: center;
      font-size: 16px;
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
    gap: 15px;

    .item {
      display: flex;
      border-radius: 4px;
      padding: 12px 2px;
      margin-top: 6px;

      &:hover {
        background-color: var(--o-color-control2-light);
      }
    }
  }
}

.no-messages {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 24px;
  font-size: 16px;
  color: var(--o-color-info3);

  img {
    height: 162px;
    width: 276px;
  }
}

.checkbox-wrapper {
  margin-top: 14px;
  height: 0;
}

:deep(.o-collapse-item-body) {
  padding-bottom: 4px;
}
</style>
