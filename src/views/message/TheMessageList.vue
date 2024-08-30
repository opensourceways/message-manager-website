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
  OSelect,
  OOption,
  OPopover,
  OLink,
  ODivider,
  OIcon,
  OInput,
  ODialog,
  OButton,
  OPagination,
} from '@opensig/opendesign';
import MessageListItem from './components/MessageListItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import IconDelete from '~icons/app/icon-delete.svg';
import IconRead from '~icons/app/icon-read.svg';
import IconSearch from '~icons/app/icon-search.svg';

import { EUR_BUILD_STATUS, EventSourceNames, EventSources } from '@/data/event';
import type { MessageT } from '@/@types/type-messages';
import { deleteMessages, getMessages, getRepoList, getAllSigs, readMessages, saveRule, filterByRule } from '@/api/messages';
import { useConfirmDialog, useDebounceFn } from '@vueuse/core';
import { useCheckbox } from '@/composables/useCheckbox';
import { useLoginStore, useUserInfoStore } from '@/stores/user';
import { useUnreadMsgCountStore } from '@/stores/common';
import IconLink from '@/components/IconLink.vue';
import AppPagination from '@/components/AppPagination.vue';
import { usePhoneStore } from '@/stores/phone';
import MessageListFilterDlg from './components/MessageListFilterDlg.vue';
import FilterableSelect from '@/components/FilterableSelect.vue';
import TagInput from '@/components/TagInput.vue';
import { getRules } from '../../api/messages';
import { getAllSubs } from '@/api/api-settings';

const userStore = useUserInfoStore();
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

const isPhone = inject<Ref<boolean>>('isPhone');
provide('isPhone', isPhone);
let intervalId: ReturnType<typeof setInterval>;

onMounted(() => {
  intervalId = setInterval(getData, 10_000);
});

onUnmounted(() => clearInterval(intervalId));

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
});

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

const selectRule = (val: { source: string, mode_name: string, id: string }) => {
  if (val) {
    filterByRule({
      source: val.source,
      mode_name: val.mode_name
    })
  }
};

watch([() => filterParams.page, () => filterParams.count_per_page], () => getData());

const resetParams = () => {
  Object.keys(filterParams).forEach((key) => {
    if (key === 'page') {
      filterParams[key] = 1;
    } else if (key === 'count_per_page') {
      filterParams[key] = 10;
    } else {
      filterParams[key] = '';
    }
  });
};

// ------------------------过滤规则------------------------
const ruleName = ref('');

const saveFilterRule = () => {
  if (!ruleName.value) {
    return;
  }
  const data: Record<string, any> = {};
  Object.keys(filterParams).forEach((key) => {
    const val = filterParams[key];
    if (val) {
      data[key] = val;
    }
  });
  saveRule({ spec_version: '1.0', mode_name: ruleName.value, ...data })
    .then(() => message.success({ content: '保存成功' }));
};

// ------------------------eur消息过滤------------------------
const eurTime = ref<[Date, Date]>();

const onEurTimeChange = (val: [Date, Date] | null) => {
  if (!val) {
    filterParams.start_time = '';
    filterParams.end_time = '';
    return;
  }
  const [ startTime, endTime ] = val;
  filterParams.start_time = startTime.getTime().toString();
  filterParams.end_time = endTime.getTime().toString();
};

const executorSearchChange = (val: string[]) => {
  filterParams.build_creator = val.join();
  getData();
}

const ownerSearchChange = (val: string[]) => {
  filterParams.build_owner = val.join();
  getData();
}

const onBuildStatusChange = (val: string[]) => {
  filterParams.build_status = val.join();
  getData();
};

// ------------------------gitee消息过滤------------------------
const giteeEventType = ref<string>('pr');

watch(giteeEventType, val => {
  filterParams.pr_assignee = '';
  filterParams.issue_assignee = '';
  router.push({
    path: '/',
    query: {
      source: EventSources.GITEE,
      event_type: val || undefined,
    },
  });
});

const mentionedMeChange = (val: (string | number)[]) => {
  const loginName = userStore.identities.find((id) => id.identity === 'gitee')?.login_name;
  if (val.length && loginName) {
    filterParams.about = '@' + loginName;
  } else {
    filterParams.about = '';
  }
  getData();
};

const myRepoChange = (val: (string | number)[]) => {
  const loginName = userStore.identities.find((id) => id.identity === 'gitee')?.login_name;
  if (val.length && loginName) {
    filterParams.my_management = loginName;
  } else {
    filterParams.my_management = '';
  }
  getData();
};

const mySigChange = (val: (string | number)[]) => {
  const loginName = userStore.identities.find((id) => id.identity === 'gitee')?.login_name;
  if (val.length && loginName) {
    filterParams.my_sig = loginName;
  } else {
    filterParams.my_sig = '';
  }
  getData();
};

const assignToMeChange = (val: (string | number)[]) => {
  const loginName = userStore.identities.find((id) => id.identity === 'gitee')?.login_name;
  if (val.length && loginName) {
    filterParams[`${giteeEventType.value}_assignee`] = loginName;
    filterParams.about = '@' + loginName;
  } else {
    filterParams[`${giteeEventType.value}_assignee`] = '';
    filterParams.about = '';
  }
  getData();
};

const giteeEventTypeOptions = [
  { value: 'push', label: 'Push' },
  { value: 'pr', label: 'Pull Request' },
  { value: 'issue', label: 'Issue' },
  { value: 'note', label: '评论' },
];

const robotSelectOptions = [
  { value: 'true', label: '机器人' },
  { value: 'false', label: '非机器人' },
];

const isBotChange = (val: string[]) => {
  filterParams.is_bot = val.join();
  getData();
};

const noteType = [
  'Issue',
  'PullRequest',
];

const noteTypeChange = (val: string[]) => {
  filterParams.note_type = val.join();
  getData();
};

const issueState = [
  { value: 'open', label: '待办的' },
  { value: 'progressing', label: '进行中' },
  { value: 'closed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' },
];

const issueStateChange = (val: string[]) => {
  filterParams.issue_state = val.join();
  getData();
};

const prState = [
  { value: 'open', label: '开启' },
  { value: 'closed', label: '关闭' },
  { value: 'can_be_merged', label: '可合并' },
  { value: 'cannot_be_merged', label: '不可合并' },
];

const prStateChange = (val: string[]) => {
  filterParams.pr_state = val.join();
  getData();
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

// ------------------------会议消息过滤------------------------
const meetingActState = [
  { value: 'create_meeting', label: '创建' },
  { value: 'delete_meeting', label: '删除' },
];

const meetingActStateChange = (val: string[]) => {
  filterParams.meeting_action = val.join();
  getData();
};

const meetingSigChange = (val: (string | number)[]) => {
  filterParams.meeting_sig = val.join();
  getData();
};

// ------------------------获取数据------------------------
const getData = () => {
  getMessages({
    ...filterParams,
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

const debouncedGetData = useDebounceFn(getData, 300);

// ------------------------菜单事件------------------------
const activeMenu = ref('all');

const onMenuChange = (menu: string) => {
  // 清空过滤
  resetParams();
  if (menu === 'all') {
    router.push({ path: '/' });
  } else {
    // 清空gitee消息类型过滤
    if (giteeEventType.value) {
      giteeEventType.value = '';
    }
    router.push({
      path: '/',
      query: {
        source: menu,
        event_type: menu === EventSources.EUR ? 'build' : giteeEventType.value,
      },
    });
  }
};

// ------------------------监听路由改变------------------------
watch(
  () => route.query,
  () => {
    const { source, event_type } = route.query;
    filterParams.source = (source ?? '') as string;
    filterParams.event_type = (event_type ?? '') as string;
    if (filterParams.page !== 1) {
      filterParams.page = 1;
    } else {
      getData();
    }
    if (source && source !== activeMenu.value) {
      activeMenu.value = source as string;
    } else if (!source && activeMenu.value !== 'all') {
      activeMenu.value = 'all';
    }
    if (event_type) {
      switch (source) {
        case EventSources.GITEE:
          if (event_type !== giteeEventType.value) {
            giteeEventType.value = event_type as string;
          }
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
  { value: '1', label: '已读消息' },
  { value: '0', label: '未读消息' },
]);

watch(readStatus, (val: string | number) => {
  if (val === 'all') {
    filterParams.is_read = '';
  } else {
    filterParams.is_read = val as string;
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

const filterConfirm = (source: string, event_type: string) => {
  if (!source && !event_type) {
    router.push({ path: '/' });
    return;
  }
  router.push({ path: '/', query: { source, event_type } });
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
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="filterConfirm"></MessageListFilterDlg>

  <!-- 移动端特有弹窗 -->
  <MessageListFilterDlg v-model:visible="phoneStore.isFiltering" @confirm="filterConfirm"></MessageListFilterDlg>

  <ODialog v-model:visible="showDlg">
    <ul>
      <li v-for="item in rules" :key="item.id">
        <OLink @click="selectRule(item)" style="margin-top: 8px;">{{ item.mode_name }}</OLink>
      </li>
    </ul>
  </ODialog>

  <div class="messages-container">
    <aside v-if="!isPhone">
      <div class="title">
        消息中心
        <!-- <IconLink ref="settingsIcon" @click="toConfig">
          <template #suffix><IconSettings /></template>
        </IconLink> -->
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
      <OButton @click="showDlg = true">保存的规则</OButton>
      <div class="message-list">
        <div class="header">
          <div class="left">
            <OCheckbox v-model="parentCheckbox" :indeterminate="indeterminate" :value="1"></OCheckbox>
            <!-- 已读状态筛选 -->
            <OSelect class="select" v-model="readStatus" variant="text" style="width: 112px">
              <OOption class="select-option" v-for="item in readStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
            <template v-if="!isPhone && activeMenu !== 'all'">
              <OInput v-model="ruleName" placeholder="规则名称"></OInput>
              <OButton @click="saveFilterRule">保存规则</OButton>
              <!-- eur过滤 -->
              <template v-if="route.query.source === EventSources.EUR">
                <OInput v-model="filterParams.build_env" placeholder="构建环境" @input="debouncedGetData"></OInput>
                <OSelect filterable style="width: 150px;" :multiple="true" @change="onBuildStatusChange" placeholder="构建状态">
                  <OOption v-for="item in EUR_BUILD_STATUS" :key="item.value" :value="item.value" :label="item.label">
                    {{ item.label }}
                  </OOption>
                </OSelect>
                <!-- 创建者 -->
                <TagInput @change="executorSearchChange" placeholder="创建者">
                  <template #suffix>
                    <div style="display: flex">
                      <IconSearch class="icon-search" @click="getData" />
                    </div>
                  </template>
                </TagInput>
                <!-- 所有者 -->
                <TagInput @change="ownerSearchChange" placeholder="所有者">
                  <template #suffix>
                    <div style="display: flex">
                      <IconSearch class="icon-search" @click="getData" />
                    </div>
                  </template>
                </TagInput>
                <el-date-picker
                  v-model="eurTime"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  @change="onEurTimeChange"
                />
              </template>

              <!-- gitee消息过滤 -->
              <template v-if="route.query.source === EventSources.GITEE">
                <OCheckbox @change="myRepoChange" value="1">我管理的仓库</OCheckbox>
                <OCheckbox @change="mySigChange" value="1">我的sig组</OCheckbox>
                <OCheckbox @change="mentionedMeChange" value="1">@我的</OCheckbox>
                <OSelect
                  clearable
                  v-model="giteeEventType"
                  style="width: 130px;"
                  placeholder="消息类型"
                >
                  <OOption v-for="item in giteeEventTypeOptions" :key="item.value" :value="item.value" :label="item.label">
                    {{ item.label }}
                  </OOption>
                </OSelect>

                <OSelect style="width: 150px;" :multiple="true" @change="isBotChange" placeholder="是否机器人">
                  <OOption v-for="item in robotSelectOptions" :key="item.value" :value="item.value" :label="item.label">
                    {{ item.label }}
                  </OOption>
                </OSelect>
                <!-- sig筛选 -->
                <FilterableSelect :values="sigList" @change="onGiteeSigChange" placeholder="sig"></FilterableSelect>
                <!-- 仓库名称 -->
                <FilterableSelect :values="repoRenderList" @change="onRepoChange" placeholder="仓库"></FilterableSelect>

                <OSelect v-if="giteeEventType === 'note'" style="width: 150px;" :multiple="true" @change="noteTypeChange" placeholder="note_type">
                  <OOption v-for="item in noteType" :key="item" :value="item" :label="item">
                    {{ item }}
                  </OOption>
                </OSelect>

                <template v-if="giteeEventType === 'pr'">
                  <OCheckbox @change="assignToMeChange" value="1">指派给我的</OCheckbox>
                  <OInput v-model="filterParams.pr_creator" @input="debouncedGetData" placeholder="pr_creator"></OInput>
                  <OSelect :multiple="true" @change="prStateChange" placeholder="pr_type">
                    <OOption v-for="item in prState" :key="item.value" :value="item.value" :label="item.label">
                      {{ item.label }}
                    </OOption>
                  </OSelect>
                </template>

                <template v-if="giteeEventType === 'issue'">
                  <OCheckbox @change="assignToMeChange" value="1">指派给我的</OCheckbox>
                  <OInput v-model="filterParams.issue_creator" @input="debouncedGetData" placeholder="issue_creator"></OInput>
                  <OSelect :multiple="true" @change="issueStateChange" placeholder="issue_type">
                    <OOption v-for="item in issueState" :key="item.value" :value="item.value" :label="item.label">
                      {{ item.label }}
                    </OOption>
                  </OSelect>
                </template>
              </template>
              <!-- 会议消息过滤 -->
              <template v-if="route.query.source === EventSources.MEETING">
                <OSelect filterable :multiple="true" @change="meetingActStateChange" placeholder="meeting_action">
                  <OOption v-for="item in meetingActState" :key="item.value" :value="item.value" :label="item.label">
                    {{ item.label }}
                  </OOption>
                </OSelect>
                <!-- sig筛选 -->
                <FilterableSelect :values="sigList" @change="meetingSigChange" placeholder="sig"></FilterableSelect>
              </template>
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
  <AppPagination v-if="!isPhone && total > 0" topMargin="40px" :total="total" v-model:page="filterParams.page" v-model:pageSize="filterParams.count_per_page" />
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
