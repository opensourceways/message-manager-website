<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh';
import { OCheckbox, OCollapse, OCollapseItem, OMenu, OMenuItem, OPagination, OSubMenu, useMessage, OSelect, OOption } from '@opensig/opendesign';
import { events } from '@/data/subscribeSettings';
import MessageListItem from './components/MessageListItem.vue';
import HorizontalLine from '@/components/HorizontalLine.vue';
import MessagesOperation from './components/MessagesOperation.vue';
import { eventDisplayNames } from '@/data/subscribeSettings';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, readMessages } from '@/api/messages';

const msg = useMessage();
const { locale } = useI18n();
const router = useRouter();
const expandedMenus = ref(events.map((_, index) => `${index}`));
const checkedAll = ref<number[]>([]);
const thisWeekCheckedAll = ref<number[]>([]);
const aWeekAgoCheckedAll = ref<number[]>([]);
const checkedItems = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const thisWeekMessages = ref<MessageT[]>([]);
const aWeekAgoMessages = ref<MessageT[]>([]);
const collapseExpanded = ref([1, 2]);
const activeSource = ref<string | undefined>();
const activeEventType = ref<string | undefined>();
const isRead = ref<0 | 1 | undefined>();

const NOW = dayjs();
dayjs.locale(locale.value);

const toConfig = () => router.push('/settings');

const getData = (pageOption = { page: 1, pageSize: 10 }) => {
  getMessages(activeSource.value, activeEventType.value, isRead.value, pageOption.page, pageOption.pageSize).then(({ total: returnTotal, data }) => {
    thisWeekMessages.value = [];
    aWeekAgoMessages.value = [];
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

const activeMenu = ref('all');

watch(activeMenu, (menu) => {
  if (menu === 'all') {
    activeSource.value = undefined;
    activeEventType.value = undefined;
  } else {
    const [source, type] = menu.split('_');
    activeSource.value = source;
    activeEventType.value = type;
  }
  getData();
});

const delMessages = () => {
  const set = new Set(checkedItems.value);
  const messages = [];
  messages.push(...thisWeekMessages.value.filter((item) => set.has(item.id)));
  messages.push(...aWeekAgoMessages.value.filter((item) => set.has(item.id)));
  deleteMessages(...messages)
    .then(() => getData())
    .catch((error) => {
      if (error?.response?.data?.message) {
        msg.warning(error.response.data.message);
      }
    });
};

const markReadMessages = () => {
  const set = new Set(checkedItems.value);
  const messages = [];
  messages.push(...thisWeekMessages.value.filter((item) => set.has(item.id)));
  messages.push(...aWeekAgoMessages.value.filter((item) => set.has(item.id)));
  readMessages(...messages)
    .then(() => getData())
    .catch((error) => {
      if (error?.response?.data?.message) {
        msg.warning(error.response.data.message);
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
    isRead.value = undefined;
  } else {
    isRead.value = 1;
  }
  getData();
});
</script>

<template>
  <div class="messages-container">
    <aside>
      <div class="title">
        消息中心
        <div @click="toConfig">
          <img class="active" src="@/assets/svg-icons/icon-setting-active.svg" alt="" style="width: 24px; height: 24px" />
          <img class="inactive" src="@/assets/svg-icons/icon-setting.svg" alt="" style="width: 24px; height: 24px" />
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
      <div class="header">
        <div class="left">
          <OCheckbox v-model="checkedAll" :value="1"></OCheckbox>
          <OSelect v-model="selectedVal" variant="text">
            <OOption v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
          </OSelect>
        </div>
        <div class="right">
          <MessagesOperation type="delete" :disabled="checkedItems.length === 0" @perform="delMessages" label="删除" />
          <MessagesOperation type="mark-read" :disabled="checkedItems.length === 0" @perform="markReadMessages" label="标记已读" />
        </div>
      </div>
      <div class="list">
        <OCollapse v-model="collapseExpanded">
          <OCollapseItem :value="1">
            <template #title>
              <div style="display: flex; align-items: center; gap: 36px">
                <OCheckbox v-model="thisWeekCheckedAll" :value="1" @click.capture.stop></OCheckbox>
                <span>本周</span>
              </div>
            </template>
            <div v-for="msg in thisWeekMessages" :key="msg.id" class="item">
              <div class="checkbox-wrapper">
                <OCheckbox :value="msg.id" v-model="checkedItems" />
              </div>
              <MessageListItem :msg="msg" />
              <HorizontalLine />
            </div>
          </OCollapseItem>
          <OCollapseItem :value="2">
            <template #title>
              <div style="display: flex; align-items: center; gap: 36px">
                <OCheckbox v-model="aWeekAgoCheckedAll" :value="1" @click.capture.stop />
                <span>一周前</span>
              </div>
            </template>
            <template v-for="msg in aWeekAgoMessages" :key="msg.id">
              <div class="item">
                <div class="checkbox-wrapper">
                  <OCheckbox :value="msg.id" v-model="checkedItems" />
                </div>
                <MessageListItem :msg="msg" />
              </div>
            </template>
          </OCollapseItem>
        </OCollapse>
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
  background-color: #fff;
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
        background-color: #e7edf6;
      }
    }
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
