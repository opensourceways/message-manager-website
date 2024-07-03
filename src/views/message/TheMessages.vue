<script setup lang="ts">
import type { MessageT } from '@/@types/type-messages';
import { getMessages } from '@/api/messages';
import { OCheckbox, OCollapse, OCollapseItem, OIconChevronDown, OMenu, OMenuItem, OPagination, OSubMenu } from '@opensig/opendesign';
import dayjs from 'dayjs';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const expandedMenus = ref(['1', '2']);
const checkedAll = ref<number[]>([]);
const thisWeekCheckedAll = ref<number[]>([]);
const aWeekAgoCheckedAll = ref<number[]>([]);
const checkedItems = ref<number[]>([]);
// const messages = ref<MessageT[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const thisWeekMessages = ref<MessageT[]>([]);
const aWeekAgoMessages = ref<MessageT[]>([]);
const expanded = ref([1, 2]);

const NOW = dayjs();
const SOURCES: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR',
  'https://gitee.com': 'Gitee',
};
const EVENT_TYPES: Record<string, string> = {
  'build': '构建',
  'issue': 'Issue',
  'push': 'Push',
  'pr': 'Pull Request',
  'note': '评论',
};

function toConfig() {
  router.push('/config');
}

function getData(val = { page: 1, pageSize: 10 }, source?: string, eventType?: string, isRead?: 0 | 1) {
  getMessages(source, eventType, isRead, val.page, val.pageSize).then(({ total: returnTotal, data }) => {
    thisWeekMessages.value = [];
    aWeekAgoMessages.value = [];
    // messages.value = data;
    total.value = returnTotal;
    for (const item of data) {
      const date = dayjs(item.time);
      if (NOW.diff(date, 'week') === 0) {
        thisWeekMessages.value.push(item);
      } else {
        aWeekAgoMessages.value.push(item);
      }
    }
  });
}

function onHoverMultiOperationIcon(event: MouseEvent, type: 'delete' | 'mark-read') {
  if (event.target) {
    if (checkedItems.value.length) {
      (event.target as HTMLImageElement).src = `/src/assets/svg-icons/icon-${type}-active.svg`;
    }
  }
}

function onMouseLeaveMultiOperationIcon(event: MouseEvent, type: 'delete' | 'mark-read') {
  if (event.target) {
    if (checkedItems.value.length) {
      (event.target as HTMLImageElement).src = `/src/assets/svg-icons/icon-${type}.svg`;
    }
  }
}
</script>

<template>
  <div class="messages-container">
    <aside>
      <div class="title">
        消息中心
        <div @click="toConfig">
          <img class="active" src="@/assets/svg-icons/icon-setting-active.svg" alt="" style="width: 24px; height: 24px;">
          <img class="inactive" src="@/assets/svg-icons/icon-setting.svg" alt="" style="width: 24px; height: 24px;">
        </div>
        <!-- <img src="@/assets/svg-icons/icon-setting.svg" style="width: 24px; height: 24px;" /> -->
      </div>
      <OMenu v-model:expanded="expandedMenus">
        <OSubMenu value="1">
          <template #title>
            <p>消息来源</p>
          </template>
          <OMenuItem value="all">
            全部消息来源
          </OMenuItem>
          <OMenuItem value="https://eur.openeuler.openatom.cn">
            EUR消息
          </OMenuItem>
          <OSubMenu value="2">
            <template #title>
              <p>Gitee</p>
            </template>
            <OMenuItem value="https://gitee.com_issue">
              Issue
            </OMenuItem>
            <OMenuItem value="https://gitee.com_push">
              Push
            </OMenuItem>
            <OMenuItem value="https://gitee.com_pr">
              Pull Request
            </OMenuItem>
            <OMenuItem value="https://gitee.com_note">
              评论
            </OMenuItem>
          </OSubMenu>
        </OSubMenu>
      </OMenu>
    </aside>

    <div class="message-list">
      <!-- <template v-if="total">
      </template> -->
      <div class="header">
        <div class="left">
          <OCheckbox v-model="checkedAll" :value="1"></OCheckbox>
          <span style="margin-left: 36px;">全部消息</span>
          <span style="font-size: 24px; margin-left: 14px;">
            <OIconChevronDown />
          </span>
        </div>
        <div class="right" :style="{ opacity: checkedItems.length === 0 ? 0.4 : 1 }">
          <img 
            src="@/assets/svg-icons/icon-delete.svg" 
            @mouseenter="onHoverMultiOperationIcon($event, 'delete')" 
            @mouseleave="onMouseLeaveMultiOperationIcon($event, 'delete')"
          />
          <span style="margin-left: 8px;">删除</span>
          <img
            src="@/assets/svg-icons/icon-mark-read.svg"
            @mouseenter="onHoverMultiOperationIcon($event, 'mark-read')"
            @mouseleave="onMouseLeaveMultiOperationIcon($event, 'mark-read')" style="margin-left: 16px;"
          />
          <span style="margin-left: 8px;">标记已读</span>
        </div>
      </div>
      <div class="list">
        <OCollapse v-model="expanded">
          <OCollapseItem :value="1">
            <template #title>
              <div style="display: flex; align-items: center; gap: 36px;">
                <OCheckbox v-model="thisWeekCheckedAll" :value="1"></OCheckbox>
                <span>本周</span>
              </div>
            </template>
            <div v-for="(msg) in thisWeekMessages" :key="msg.id" class="item">
              <OCheckbox :value="msg.id" v-model="checkedItems"  @click.capture.stop/>
              <div class="dot-icon" v-if="!msg.is_read"></div>
              <div class="detail">
                <div class="left">
                  <p class="msg-title" :unread="!msg.is_read">{{ msg.title }}</p>
                  <p></p>
                </div>
                <div class="right">
                  <p>{{ msg.formattedTime }}</p>
                  <p>{{ SOURCES[msg.source] }} | {{ EVENT_TYPES[msg.type] }}动态</p>
                </div>
              </div>
            </div>
          </OCollapseItem>
          <OCollapseItem :value="2">
            <template #title>
              <div style="display: flex; align-items: center; gap: 36px;">
                <OCheckbox v-model="aWeekAgoCheckedAll" :value="1" @click.capture.stop />
                <span>一周前</span>
              </div>
            </template>
            <div v-for="(msg) in aWeekAgoMessages" :key="msg.id" class="item">
              <OCheckbox :value="msg.id" v-model="checkedItems" />
              <div class="dot-icon" v-if="!msg.is_read"></div>
              <div class="detail">
                <div class="left">
                  <p class="msg-title" :unread="!msg.is_read">{{ msg.title }}</p>
                  <p></p>
                </div>
                <div class="right">
                  <p>{{ msg.formattedTime }}</p>
                  <p>{{ SOURCES[msg.source] }} | {{ EVENT_TYPES[msg.type] }}动态</p>
                </div>
              </div>
            </div>
          </OCollapseItem>
        </OCollapse>
      </div>
    </div>

  </div>
  <OPagination :total="total" :page="currentPage" :pageSize="pageSize" show-total @change="getData"/>
</template>

<style scoped lang="scss">
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
  background-color: #002EA7;
  margin-left: 12px;
}

.messages-container {
  display: flex;
  gap: 32px;
  width: 80vw;
  min-height: 900px;

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
            display: inline
          }

          .inactive {
            display: none;
          }
        }
      }
    }
  }
}

.msg-title {
  font-size: 22px;
  font-weight: normal;

  &[unread="true"] {
    font-weight: bold;
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
      font-size: 16px;

      img {
        width: 24px;
        height: 24px;
      }
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 15px;

    .item {
      display: flex;
      align-items: center;

      .dot-icon {
        margin-left: 12px;
      }

      .detail {
        margin-left: 16px;
        display: flex;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        .left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .right {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
      }
    }
  }
}
</style>