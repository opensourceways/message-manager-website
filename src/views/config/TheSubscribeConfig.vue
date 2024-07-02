<script setup lang="ts">
import { OButton, ODialog, OForm, OFormItem, OIconChevronRight, OInput, OLink, OOption, OPagination, ORadio, OSelect } from '@opensig/opendesign';
import TheCheckbox from '@/components/TheCheckbox.vue';
import { computed, reactive, ref } from 'vue';
import type { Subscribe } from '@/@types/type-config';
import { useTable } from '@/composables/useTable';
import { getSubscribes, postEurCondition } from '@/api/config';
import TheEditorWithTags from './components/TheEditorWithTags.vue';

interface ParsedData extends Subscribe {
  recipient_ids: string[];
  need_message_count: number;
  need_phone_count: number;
  need_mail_count: number;
  need_inner_message_count: number;
}

const sourceToNameMap: Record<string, string> = {
  'https://gitee.com': 'Gitee消息',
  'https://eur.openeuler.openatom.cn': 'EUR消息',
}

class Row {
  key: number;
  displayName?: string;
  rootSource?: string;
  children?: Row[];
  collapsed = false;
  level = 1;
  checked = false;
  indeterminate = false;
  data: ParsedData;
  needMessageType: 0 | 1 | 2;
  needPhoneType: 0 | 1 | 2;
  needMailType: 0 | 1 | 2;
  needInnerMessageType: 0 | 1 | 2;

  constructor(data: ParsedData) {
    this.data = data;
    this.key = data.id;
    this.displayName = data.mode_name || sourceToNameMap[data.source];
    this.needMessageType = data.need_message_count > 0 ? (data.need_message_count < data.recipient_ids.length ? 1 : 2) : 0;
    this.needPhoneType = data.need_phone_count > 0 ? (data.need_phone_count < data.recipient_ids.length ? 1 : 2) : 0;
    this.needMailType = data.need_mail_count > 0 ? (data.need_mail_count < data.recipient_ids.length ? 1 : 2) : 0;
    this.needInnerMessageType = data.need_inner_message_count > 0 ? (data.need_inner_message_count < data.recipient_ids.length ? 1 : 2) : 0;
  }
}

const tableColumns = [
  { label: '消息类型', key: 'event_type' },
  { label: '站内消息', key: 'need_inner_message' },
  { label: '邮箱', key: 'need_mail' },
  { label: '短信', key: 'need_message' },
  { label: '电话', key: 'need_phone' },
  { label: 'API钩子', key: 'api_hook' },
  { label: '消息接收人', key: 'recipient_id' },
  { label: '操作', key: 'operation' },
];
const rows = ref<Row[]>([]);
const {
  pageSizes,
  pageSize,
  currentPage,
  tableTotal,
} = useTable(undefined, requestData);
const showAddEurDlg = ref(false);
const showAddGiteeDlg = ref(false);

function requestData(page?: number, pageSize?: number) {
  getSubscribes(page, pageSize).then(({ total, data }) => {
    tableTotal.value = total;
    const map = new Map<number, ParsedData>();
    for (const item of data) {
      let e = map.get(item.id);
      if (!e) {
        e = item as ParsedData;
        e.recipient_ids = [item.recipient_id];
        e.need_message_count = 0;
        e.need_phone_count = 0;
        e.need_mail_count = 0;
        e.need_inner_message_count = 0;
        map.set(item.id, e);
      } else {
        e.recipient_ids.push(item.recipient_id);
        e.need_message_count += item.need_message ? 1 : 0;
        e.need_phone_count += item.need_phone ? 1 : 0;
        e.need_mail_count += item.need_mail ? 1 : 0;
        e.need_inner_message_count += item.need_inner_message ? 1 : 0;
      }
    }
    rows.value = [...map.values()].map(item => new Row(item));
  })
}

const sourceDataMap = computed(() => {
  return rows.value.reduce((map, cur) => {
    return cur.data.mode_name ? map.set(cur.data.mode_name, cur) : map;
  }, new Map<string, Row>());
});
const treeData = computed(() => {
  const map = sourceDataMap.value;
  const set = new Set<Row>();
  for (const item of map.values()) {
    if (item.data.mode_name) {
      item.rootSource = item.data.source;
      const parent = map.get(item.data.source) as Row;
      item.level = parent.level + 1;
      parent.children ??= [];
      parent.children.push(item);
    } else {
      set.add(item);
    }
  }
  return [...set];
});
const flattenedData = computed(() => {
  return treeData.value.flatMap(row => {
    const result: Row[] = [row];
    if (row.children?.length) {
      row.children.forEach(function recursion(child) {
        result.push(child);
        if (child.children?.length) {
          child.children.forEach(recursion);
        }
      });
    }
    return result;
  });
});
const checkedIds = ref(new Set<number | string>());
const eurBuildTopics = [
  { label: '开始', value: 'start' },
  { label: '结束', value: 'end' },
]
const eurBuildStatus = [
  { label: 'failed', value: 0 },
  { label: 'succeeded', value: 1 },
  { label: 'canceled', value: 2 },
  { label: 'running', value: 3 },
  { label: 'pending', value: 4 },
  { label: 'skipped', value: 5 },
  { label: 'starting', value: 6 },
  { label: 'importing', value: 7 },
  { label: 'forked', value: 8 },
  { label: 'waiting', value: 9 },
  { label: 'unknown', value: 1000 },
]
const newEurCondition = reactive({
  source: '',
  mode_name: '',
  event_type: '',
  mode_filter: {
    name: '',
    owner: '',
    topic: [],
    status: [],
  },
});
const newGiteeCondition = reactive({
  source: '',
  mode_name: '',
  event_type: '',
  mode_filter: {
    repoNames: [],
    committer: '',
  }
});

const INDENT = 74;

function countByCondition<T>(arr: T[], fn: (item: T) => boolean) {
  return arr.reduce((count, item) => count + (fn(item) ? 1 : 0), 0);
}

function collapseOrExpandRow(row: Row) {
  if (row.children?.length) {
    row.collapsed ??= false;
    row.collapsed = !row.collapsed;
  }
}

function onCheckboxChange(row: Row) {
  if (row.rootSource) {
    const root = sourceDataMap.value.get(row.rootSource) as Row;
    const childrenCheckedCount = countByCondition(root.children as Row[], child => !!child.checked);
    if (childrenCheckedCount === root.children?.length) {
      root.checked = true;
      root.indeterminate = false;
    } else if (childrenCheckedCount === 0) {
      root.checked = false;
      root.indeterminate = false;
    } else {
      root.indeterminate = true;
      root.checked = false;
    }
    if (row.checked) {
      checkedIds.value.add(row.key);
    } else {
      checkedIds.value.delete(row.key);
    }
    return;
  }
  if (row.children?.length) {
    if (row.checked) {
      row.indeterminate = false;
      for (const child of row.children) {
        child.checked = true;
        checkedIds.value.add(child.key);
      }
    } else {
      row.indeterminate = false;
      for (const child of row.children) {
        child.checked = false;
        checkedIds.value.delete(child.key);
      }
    }
    return;
  }
  if (row.checked) {
    checkedIds.value.add(row.key);
  } else {
    checkedIds.value.delete(row.key);
  }
}

function addNewCondition(row: Row) {
  switch (row.data.source) {
    case 'https://gitee.com':
      addGiteeCondition(row);
      break;
    case 'https://eur.openeuler.openatom.cn':
      addEurCondition(row);
      break;
  }
}

function addEurCondition(row: Row) {
  newEurCondition.source = row.data.source;
  newEurCondition.mode_name = row.data.mode_name;
  newEurCondition.event_type = row.data.event_type;
  showAddEurDlg.value = true;
}

const commaSeparator = /\s*(?:,|，)\s*/;

function confirmAddEurCondition() {
  postEurCondition({
    ...newEurCondition,
    mode_filter: {
      ...newEurCondition.mode_filter,
      name: newEurCondition.mode_filter.name.split(commaSeparator),
      owner: newEurCondition.mode_filter.owner.split(commaSeparator),
    }
  }).then(() => {
    cancelAddEurCondition();
    requestData(currentPage.value, pageSize.value);
  })
}

function cancelAddEurCondition() {
  showAddEurDlg.value = false;
  newEurCondition.mode_name = '';
  newEurCondition.event_type = '';
  newEurCondition.mode_filter = {
    name: '',
    owner: '',
    topic: [],
    status: [],
  };
}

function addGiteeCondition(row: Row) {
  newGiteeCondition.source = row.data.source;
  newGiteeCondition.mode_name = row.data.mode_name;
  newGiteeCondition.event_type = row.data.event_type;
  showAddGiteeDlg.value = true;
}

function confirmAddGiteeCondition() {
  postEurCondition(newGiteeCondition).then(() => {
    cancelAddEurCondition();
    requestData(currentPage.value, pageSize.value);
  })
}

function cancelAddGiteeCondition() {
  showAddGiteeDlg.value = false;
  newGiteeCondition.mode_name = '';
  newGiteeCondition.event_type = '';
  newGiteeCondition.mode_filter = {
    repoNames: [],
    committer: '',
  };
}

const showEditRecipientDlg = ref(false);
</script>

<template>
  <div class="button-group">
    <OButton variant="outline" round="pill" :color="checkedIds.size === 0 ? 'normal' : 'primary'">添加接收人</OButton>
    <OButton variant="outline" round="pill" :color="checkedIds.size === 0 ? 'normal' : 'primary'">移除接收人</OButton>
  </div>

  <div class="o-table" style="margin-top: 12px;">
    <ODialog v-model:visible="showAddEurDlg" :unmount-on-hide="false">
      <template #header>新增EUR消息接收条件</template>
      <p class="dialog-content-title">
        消息条件命名
      </p>
      <div class="dialog-content" style="">
        <OForm class="form" has-required label-align="top" label-justify="left" label-width="20%">
          <OFormItem label="条件名称" required>
            <OInput clearable v-model="newEurCondition.mode_name" style="width: 100%;" />
          </OFormItem>
        </OForm>
        <p class="dialog-content-title">
          消息条件接收设置（必须至少填写一项）
        </p>
        <OForm class="form" layout="h" label-align="top" label-justify="left" label-width="20%">
          <OFormItem label="项目名称" >
            <OInput clearable v-model="newEurCondition.mode_filter.name"  style="width: 100%;" />
          </OFormItem>
          <OFormItem label="项目拥有者" >
            <OInput clearable v-model="newEurCondition.mode_filter.owner"  style="width: 100%;" />
          </OFormItem>
          <OFormItem label="构建开始/结束" >
            <OSelect v-model="newEurCondition.mode_filter.topic" multiple variant="outline" placeholder="请选择构建开始/结束" clearable>
              <OOption v-for="item in eurBuildTopics" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
          </OFormItem>
          <OFormItem label="构建状态" >
            <OSelect v-model="newEurCondition.mode_filter.status" multiple variant="outline" placeholder="请选择构建开始/结束" clearable>
              <OOption v-for="item in eurBuildStatus" :key="item.value" :label="item.label" :value="item.value" />
            </OSelect>
          </OFormItem>
        </OForm>
      </div>
      <template #footer>
        <div class="dlg-action">
          <OButton color="primary" variant="solid" @click="confirmAddEurCondition">确定</OButton>
          <OButton @click="cancelAddEurCondition">取消</OButton>
        </div>
      </template>
    </ODialog>

    <ODialog v-model:visible="showAddGiteeDlg" :unmount-on-hide="false">
      <template #header>新增Gitee消息接收条件</template>
      <div class="dialog-content">
        <p class="dialog-content-title">
          消息条件命名
        </p>
        <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
          <OFormItem label="条件名称" required>
            <OInput clearable v-model="newGiteeCondition.mode_name" style="width: 100%;" />
          </OFormItem>
        </OForm>
        <p class="dialog-content-title">
          消息条件命名
        </p>
        <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
          <OFormItem label="仓库名称" required>
            <TheEditorWithTags v-model="newGiteeCondition.mode_filter.repoNames" style="width: 100%;" />
          </OFormItem>
          <OFormItem label="提交人" required>
            <div style="display: flex; gap: 16px;">
              <ORadio v-model="newGiteeCondition.mode_filter.committer" value="a">机器人</ORadio>
              <ORadio v-model="newGiteeCondition.mode_filter.committer" value="b">非机器人</ORadio>
            </div>
          </OFormItem>
        </OForm>
      </div>
      <template #footer>
        <div class="dlg-action">
          <OButton color="primary" variant="solid" @click="confirmAddGiteeCondition">确定</OButton>
          <OButton @click="cancelAddGiteeCondition">取消</OButton>
        </div>
      </template>
    </ODialog>

    <div ref="el" class="o-table-wrap o-table-border-row">
      <table style="border: 1px solid rgba(0, 0, 0, 0.1);">
        <colgroup>
          <col v-for="col in tableColumns" :key="col.key" />
        </colgroup>
        <thead>
          <tr><th v-for="col in tableColumns" :key="col.key">{{ col.label }}</th></tr>
        </thead>
        <tbody>
          <tr 
            v-for="(row, rIdx) in flattenedData" 
            :key="row.key" 
            :class="[
              row.rootSource ? (sourceDataMap.get(row.rootSource)?.collapsed ? 'hidden' : '') : '',
              row.children?.length ? 'has-children' : '',
              rIdx + 1 === rows.length ? 'last' : '',
            ]"
            @click="collapseOrExpandRow(row)"
          >
            <td v-if="row.rootSource" :style="{ paddingLeft: row.level ? INDENT * row.level + 'px' : '20px' }">
              <div style="display: flex; gap: 12px; align-items: center;">
                <TheCheckbox v-model="row.checked" @change="onCheckboxChange(row)" />
                {{ row.displayName }}
              </div>
            </td>
            <td v-else-if="row.children?.length" style="position: relative;">
              <div :class="[row.collapsed ? '' : 'expanded']" style="display: flex; gap: 12px; align-items: center;">
                <span class="arrow">
                  <OIconChevronRight />
                </span>
                <TheCheckbox v-model="row.checked" :indeterminate="row.indeterminate" @change="onCheckboxChange(row)" />
                {{ row.displayName }}
                <img src="" @click="addNewCondition(row)" style="width: 24px; height: 24px; position: absolute; right: 0" />
              </div>
            </td>
            <td v-else style="position: relative;">
              <div style="display: flex; gap: 12px; align-items: center;">
                <TheCheckbox v-model="row.checked" :indeterminate="row.indeterminate" @change="onCheckboxChange(row)" />
                {{ row.displayName }}
                <img src="" @click="addNewCondition(row)" style="width: 24px; height: 24px; position: absolute; right: 0" />
              </div>
            </td>
            <td>
              <TheCheckbox v-model="row.data.need_inner_message" />
            </td>
            <td>
              <TheCheckbox v-model="row.data.need_mail" />
            </td>
            <td>
              <TheCheckbox v-model="row.data.need_message" />
            </td>
            <td>
              <TheCheckbox v-model="row.data.need_phone" />
            </td>
            <td>
              <TheCheckbox :is-disabled="true" />
            </td>
            <td>
              {{ row.data.recipient_id }}
            </td>
            <td class="last">
              <OLink color="primary">修改接收人</OLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <OPagination :total="tableTotal" v-model:page="currentPage" v-model:page-size="pageSize" :page-sizes="pageSizes" style="margin-top: 32px;"/>
  </div>
</template>

<style scoped lang="scss">
.dialog-content {
  width: 600px;
}
.dlg-action {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.dialog-content-title {
  font-size: 16px;
  font-weight: bold;
  margin-top: 16px;
  margin-bottom: 16px;
}
.form {
  width: 100%;
}

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

.button-group {
  margin-top: 12px;
  display: flex;
  gap: 24px;
}

.text {
  font-size: 16px;
}

.hidden {
  display: none;
}

.arrow {
  font-size: var(--sub-menu-arrow-size);
  transition: transform var(--o-duration-m2) var(--o-easing-standard);
}

.expanded {
  .arrow{
    transform: rotate(90deg);
  }
}
</style>