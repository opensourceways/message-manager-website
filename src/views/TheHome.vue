<script setup lang="ts">
import SeparateLine from '@/components/SeparateLine.vue';
import { OIconSearch, OMenu, OMenuItem, OSubMenu, OCheckbox, OPagination, OPopover, ODialog, OButton  } from '@opensig/opendesign';
import { computed, ref, watch } from 'vue';
import { getMessages, readMessages, deleteMessages, getUnreadCount } from '@/api/messages';
import type { MessageT } from '@/@types/type-messages';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import type { Pagination } from '@/@types/types-common';

const router = useRouter();
const IsCheckAll = {
  TRUE: [1] as [1],
  FALSE: [] as [],
}
const searchText = ref<string>();
const currentMenu = ref<string>('https://eur.openeuler.openatom.cn_');
const expandedMenus = ref<string[]>(['1']);
const messages = ref<MessageT[]>([]);
const checkAllVal = ref<[1] | []>(IsCheckAll.FALSE);
const checkedMsgIds = ref<Array<number | string>>([]);
const indeterminate = ref(false);
const currentPage = ref(1);
const noMessages = computed<boolean>(() => !messages.value || messages.value.length === 0);
const currentMsg = ref<MessageT>();
const unreadCount = ref(0);
const total = ref(0);
const showDelDialog = ref(false);
const deleteCount = ref(0);
const deleteMsgIndex = ref<number>(-1);

getUnreadCount().then(data => unreadCount.value = data);

watch(checkedMsgIds, val => {
  if (messages.value.length === 0) {
    checkAllVal.value = IsCheckAll.FALSE;
    indeterminate.value = false;
    return;
  }
  if (val.length === messages.value.length) {
    checkAllVal.value = IsCheckAll.TRUE;
    indeterminate.value = false;
  } else if (val.length > 0) {
    checkAllVal.value = IsCheckAll.FALSE;
    indeterminate.value = true;
  } else {
    checkAllVal.value = IsCheckAll.FALSE;
    indeterminate.value = false;
  }
});

watch(currentMenu, () => {
  checkedMsgIds.value = [];
  requestByPage({ page: 1, pageSize: 10 });
}, {
  immediate: true,
});

function handleCheckAll(val: Array<number | string>) {
  if (val.length) {
    checkedMsgIds.value = messages.value.map(item => item.id);
  } else {
    checkedMsgIds.value = [];
  }
}

function requestByPage({ page, pageSize }: { page: number, pageSize: number }) {
  let request: Promise<Pagination<MessageT>>;
  const [ source, type ] = currentMenu.value.split('_');
  switch (currentMenu.value) {
    case 'all':
      request = getMessages(undefined, undefined, undefined, page, pageSize);
      break;
    case 'read':
      request = getMessages(undefined, undefined, 1, page, pageSize);
      break;
    case 'unread':
      request = getMessages(undefined, undefined, 0, page, pageSize);
      break;
    default:
      request = getMessages(source, type, undefined, page, pageSize);
  }
  request.then(({ data, total: _total }) => {
    messages.value = data;
    total.value = _total;
  }).catch(() => {
    total.value = 0;
    messages.value = [];
  });
}

// ---------------删除消息---------------
function deleteMsg(index: number) {
  showDelDialog.value = true;
  deleteCount.value = 1;
  deleteMsgIndex.value = index;
  /* deleteMessages(messages.value[index]).then(() => {
    messages.value.splice(index, 1);
  }); */
}

function deleteMultiMsg() {
  if (!checkedMsgIds.value.length) return;
  showDelDialog.value = true;
}

function confirmDelete() {
  const map = messages.value.reduce((map, msg) => map.set(msg.id, msg), new Map<string, MessageT>());
  const delMsgs = deleteMsgIndex.value >= 0 ? [messages.value[deleteMsgIndex.value]] : checkedMsgIds.value.map(id => map.get(id as string));
  deleteMessages(...delMsgs as MessageT[])
      .then(() => requestByPage({ page: currentPage.value, pageSize: 10 }))
      .finally(() => {
        checkedMsgIds.value = [];
        showDelDialog.value = false;
      });
}

function cancelDelete() {
  showDelDialog.value = false;
  deleteCount.value = 0;
  deleteMsgIndex.value = -1;
}

// ---------------标记已读---------------
function readMsg(index: number) {
  const msg = messages.value[index];
  if (msg.is_read) return;
  readMessages(msg).then(() => {
    msg.is_read = true;
  });
}

function readMultiMsg() {
  if (!checkedMsgIds.value.length) return;
  const map = messages.value.reduce((map, msg) => map.set(msg.id, msg), new Map<string, MessageT>());
  readMessages(...checkedMsgIds.value.map(id => map.get(id as string)) as MessageT[])
      .then(() => {
        const set = new Set(checkedMsgIds.value);
        messages.value = messages.value.map(msg => {
          if (set.has(msg.id)) {
            msg.is_read = true;
          }
          return msg;
        })
      })
      .finally(() => checkedMsgIds.value = []);
}

function onclickMsg(msg: MessageT) {
  if (currentMsg.value && currentMsg.value.id === msg.id) {
    return;
  }
  currentMsg.value = msg;
}

function toConfig() {
  router.push('/config');
}
</script>

<template>
  <div class="page-body">
    <header>
      <p class="title_">{{ $t('msg.msgCenter') }}</p>
      <div class="header-right">
        <div class="search-input">
          <OIconSearch style="width: 24px; height: 24px;"/>
          <input type="text" v-model="searchText" :placeholder="$t('msg.search')" />
        </div>
        <p @click="toConfig">
          <img src="" alt="" style="width: 24px; height: 24px;">
          {{ $t('msg.subscribeConfig') }}
        </p>
      </div>
    </header>
    <div class="content">
      <div class="menu-part">
        <OMenu v-model="currentMenu" v-model:expanded="expandedMenus">
          <OSubMenu value="1">
            <template #title>消息类型</template>
            <OMenuItem value="https://eur.openeuler.openatom.cn_">EUR消息</OMenuItem>
            <OSubMenu value="https://gitee.com">
              <template #title>Gitee</template>
              <OMenuItem value="https://gitee.com_issue">{{ $t('msg.giteeIssue') }}</OMenuItem>
              <OMenuItem value="https://gitee.com_pr">{{ $t('msg.giteePullRequest') }}</OMenuItem>
              <OMenuItem value="https://gitee.com_push">{{ $t('msg.giteePush') }}</OMenuItem>
              <OMenuItem value="https://gitee.com_note">{{ $t('msg.giteeComment') }}</OMenuItem>
            </OSubMenu>
          </OSubMenu>
          <OSubMenu value="2">
            <template #title>{{ $t('msg.innerMessages') }}</template>
            <OMenuItem value="all">{{ $t('msg.allMessages') }}</OMenuItem>
            <OMenuItem value="read">{{ $t('msg.readMessages') }}</OMenuItem>
            <OMenuItem value="unread">{{ $t('msg.unreadMessages') }}({{ unreadCount }})</OMenuItem>
          </OSubMenu>
        </OMenu>
      </div>
      <SeparateLine direction="vertical"/>
      <div v-if="noMessages" class="no-messages">
        <img src="" alt="" style="width: 319px; height: 279px;">
        <p>{{ $t('msg.noMessages') }}</p>
      </div>
      <div v-if="!noMessages" class="message-list">
        <div class="row space-between">
          <OCheckbox class="check-all" :value="1" v-model="checkAllVal" :indeterminate="indeterminate" @change="handleCheckAll">全选</OCheckbox>
          <div class="row">
            <OPopover position="top" >
              <template #target>
                <img @click.capture="deleteMultiMsg" src="" style="width: 24px; height: 24px;">
              </template>
              删除
            </OPopover>
            <OPopover position="top" >
              <template #target>
                <img @click.capture="readMultiMsg" src="" style="width: 24px; height: 24px; margin-left: 10px">
              </template>
              标为已读
            </OPopover>
          </div>
        </div>
        <div v-for="(msg, index) in messages" :key="msg.id" class="checkbox" :checked="checkedMsgIds.includes(msg.id)" @click="onclickMsg(msg)">
          <OCheckbox :value="msg.id" v-model="checkedMsgIds" />
          <div class="message-list-item" :unread="msg.is_read">
            <p>{{ msg.title }}</p>
            <span>{{ msg.formattedTime }}</span>
          </div>
          <div class="more-options">
            <OPopover position="top" >
              <template #target>
                <img @click.capture.stop="deleteMsg(index)" src="" style="width: 24px; height: 24px;">
              </template>
              删除
            </OPopover>
            <OPopover position="top" >
              <template #target>
                <img @click.capture.stop="readMsg(index)" src="" style="width: 24px; height: 24px; margin-left: 10px">
              </template>
              标为已读
            </OPopover>
          </div>
          <div class="line"></div>
        </div>

        <div class="pagination-wrapper" >
          <OPagination v-model:page="currentPage" :total="total" :page-size="10" simple @change="requestByPage" />
        </div>
      </div>
      <SeparateLine v-if="!noMessages" direction="vertical" style="margin-left: 6px;"/>
      <div v-if="!noMessages && currentMsg" class="message-content">
        <p class="title">{{ currentMsg?.title }}</p>
        <p class="desc">
          发送时间：{{ dayjs(currentMsg?.time).format('YYYY/MM/DD HH:mm:ss') }} | {{ currentMsg?.source }} | {{ currentMsg?.type }}
        </p>
        <p class="body">
          {{ currentMsg?.summary }}
        </p>
      </div>
    </div>
    <ODialog v-model:visible="showDelDialog" :wrapper="null">
      <template #header>删除消息</template>
      <div style="display: flex; justify-content: center; align-items: center;">
        是否删除{{ deleteCount || checkedMsgIds.length }}条消息？
      </div>
      <template #footer>
        <div class="dlg-action">
          <OButton @click="confirmDelete" variant="solid" color="primary" round="pill">确定</OButton>
          <OButton @click="cancelDelete" variant="outline" color="primary" round="pill">取消</OButton>
        </div>
      </template>
    </ODialog>
  </div>
</template>

<style scoped lang="scss">
$default-page-body-width: 1416px;
$default-page-body-height: 900px;

.dlg-action {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.space-between {
  justify-content: space-between;
}

.message-content {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  height: 100%;
  width: 60%;
  padding-left: 47px;
  padding-top: 47px;

  .title {
    font-size: 20px;
    line-height: 22px;
    font-family: HarmonyHeiTi;
    font-weight: medium;
  }

  .desc {
    margin-top: 10px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6)
  }

  .body {
    flex-grow: 1;
    padding: 10px;
    box-sizing: border-box;
    margin-top: 10px;
    flex-grow: 1;
    background-color: rgba(216, 216, 216, 0.27);
  }
}

.checkbox {
  display: flex;
  margin-top: 5px;
  padding-left: 6px;
  width: 100%;
  height: 60px;
  position: relative;

  .line {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 3px);
    width: 70%;
    height: 1px;
    background-color: #E5E8F0;
  }

  .more-options {
    display: flex;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0;
    visibility: hidden;
  }
}

.checkbox[checked="true"] {
  background-color: #E5E8F0;
}

.checkbox:hover {
  background-color: #E5E8F0;

  .more-options {
    visibility: visible;
  }
}

.checkbox:active {
  background-color: #F7F8FA;
}

.message-list-item {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 7px;

  p {
    color: inherit;
    font-size: 14px;
    font-weight: medium;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    color: inherit;
    font-size: 12px;
    line-height: 18px;
    opacity: 0.6;
  }
}

.message-list-item[unread="false"] {
  color: #002ea7;
}

.check-all {
  display: block;
  padding-left: 6px;
  height: 60px;
}

.page-body {
  width: $default-page-body-width;
  height: $default-page-body-height;
  background-color: #FFF;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  padding: calc($default-page-body-height * 0.04) calc($default-page-body-width * 0.02);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: calc($default-page-body-height * 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .title_ {
    font-size: 40px;
    font-weight: medium;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 7%;

  p {
    font-size: 16px;
    white-space: nowrap;
    cursor: pointer;
  }
}

.search-input {
  display: flex;
  align-items: center;
  outline: none;
  border: 1px solid rgba(0, 0, 0, 0.25);
  width: 320px;
  height: 40px;
  padding-left: 5%;

  input {
    outline: none;
    border: none;
    margin-left: 2%;
  }
}

.content {
  display: flex;
  flex-direction: row;
  height: 85%;
}
 
.menu-part {
  height: 100%;
  width: 18%;
  overflow-y: auto;
}

.message-list {
  height: 100%;
  width: 22%;
  overflow-y: auto;
  position: relative;

  .pagination-wrapper {
    background-color: #FFF;
    position: sticky;
    bottom: 0;
    width: 100%;
    display: flex;
    padding-top: 10px;
    padding-bottom: 10px;
    justify-content: center;
  }
}

.no-messages {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-grow: 1;
  gap: 12%;
}
</style>