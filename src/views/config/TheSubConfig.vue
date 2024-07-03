<script setup lang="ts">
import { OButton, OCheckbox, ODialog, OForm, OFormItem, OInput, OLink, OOption, ORadio, OSelect, OPagination } from '@opensig/opendesign';
import { computed, reactive, ref } from 'vue';
import { getSubscribes, postSubsCondition, putSubsCondition } from '@/api/config';
import type { Subscribe } from '@/@types/type-config';
import TheEditorWithTags from './components/TheEditorWithTags.vue';

const currentPage = ref(1);
const pageSize = ref(10);
const tableTotal = ref(0);

class TableRow {
  id: any;
  name: string;
  needInnerMessageIndeterminate: boolean = false;
  needMailIndeterminate: boolean = false;
  needMessageIndeterminate: boolean = false;
  needConditions: string[] = [];
  recipientIds: string[];
  children?: TableRow[];
  hasAddIcon?: boolean;
  data: any;

  constructor(data: any) {
    this.id = data.id;
    this.data = data;
    this.name = data.mode_name;
    if (data.need_inner_message_count > 0) {
      if (data.need_inner_message_count < data.recipient_ids.length) {
        this.needInnerMessageIndeterminate = true;
      } else {
        this.needConditions.push('need_inner_message');
      }
    }
    if (data.need_mail_count > 0) {
      if (data.need_mail_count < data.recipient_ids.length) {
        this.needMailIndeterminate = true;
      } else {
        this.needConditions.push('need_mail');
      }
    }
    if (data.need_message_count > 0) {
      if (data.need_message_count < data.recipient_ids.length) {
        this.needMessageIndeterminate = true;
      } else {
        this.needConditions.push('need_message');
      }
    }
    this.recipientIds = data.recipient_ids;
  }
}

// -----------------------初始数据-----------------------
const tableData = reactive<TableRow[]>([
  {
    id: 'EUR',
    name: 'EUR消息',
    needConditions: [],
    recipientIds: [],
    needInnerMessageIndeterminate: false,
    needMailIndeterminate: false,
    needMessageIndeterminate: false,
    hasAddIcon: true,
    data: {
      source: 'https://eur.openeuler.openatom.cn',
      event_type: 'build',
    },
    children: [],
  },
  {
    id: 'GITEE',
    name: 'Gitee消息',
    needConditions: [],
    recipientIds: [],
    data: {
      source: 'https://eur.openeuler.openatom.cn',
    },
    needInnerMessageIndeterminate: false,
    needMailIndeterminate: false,
    needMessageIndeterminate: false,
    hasAddIcon: true,
    children: [
      {
        id: 'ISSUE',
        name: 'Issue事件',
        needConditions: [],
        data: {
          source: 'https://eur.openeuler.openatom.cn',
          event_type: 'issue',
        },
        recipientIds: [],
        needInnerMessageIndeterminate: false,
        needMailIndeterminate: false,
        needMessageIndeterminate: false,
        hasAddIcon: true,
        children: [],
      },
      {
        id: 'PR',
        name: 'Pull Request事件',
        needConditions: [],
        data: {
          source: 'https://eur.openeuler.openatom.cn',
          event_type: 'pr',
        },
        recipientIds: [],
        needInnerMessageIndeterminate: false,
        needMailIndeterminate: false,
        needMessageIndeterminate: false,
        hasAddIcon: true,
        children: [],
      },
      {
        id: 'PUSH',
        name: 'Push事件',
        needConditions: [],
        recipientIds: [],
        data: {
          source: 'https://eur.openeuler.openatom.cn',
          event_type: 'push',
        },
        needInnerMessageIndeterminate: false,
        needMailIndeterminate: false,
        needMessageIndeterminate: false,
        hasAddIcon: true,
        children: [],
      },
      {
        id: 'NOTE',
        name: '评论事件',
        needConditions: [],
        data: {
          source: 'https://eur.openeuler.openatom.cn',
          event_type: 'note',
        },
        recipientIds: [],
        needInnerMessageIndeterminate: false,
        needMailIndeterminate: false,
        needMessageIndeterminate: false,
        hasAddIcon: true,
        children: [],
      },
    ],
  },
]);

// -----------------------查询数据-----------------------
function getData(val = { page: 1, pageSize: 10 }) {
  getSubscribes(val.page, val.pageSize).then(({ total, data }) => {
    tableTotal.value = total;
    const map = new Map<number, Subscribe & Record<string, any>>();
    for (const item of data) {
      let e = map.get(item.id);
      if (!e) {
        e = item as Subscribe;
        e.recipient_ids = [item.recipient_id];
        e.need_message_count = item.need_message ? 1 : 0;
        e.need_mail_count = item.need_mail ? 1 : 0;
        e.need_inner_message_count = item.need_inner_message ? 1 : 0;
        map.set(item.id, e);
      } else {
        e.recipient_ids.push(item.recipient_id);
        e.need_message_count += item.need_message ? 1 : 0;
        e.need_mail_count += item.need_mail ? 1 : 0;
        e.need_inner_message_count += item.need_inner_message ? 1 : 0;
      }
    }
    resetTableData();
    for (const item of data as (Subscribe & Record<string, any>)[]) {
      item.needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
      item.needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
      item.needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
      if (item.source === 'https://eur.openeuler.openatom.cn') {
        if (item.mode_name) {
          tableData[0].children?.push(new TableRow(item));
        } else {
          tableData[0].recipientIds = item.recipient_ids;
          tableData[0].needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
          tableData[0].needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
          tableData[0].needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
        }
        continue;
      }
      if (item.source === 'https://gitee.com') {
        switch (item.event_type) {
          case 'issue':
            if (item.mode_name) {
              tableData[1].children?.[0].children?.push(new TableRow(item));
            } else {
              tableData[1].children[0].recipientIds = item.recipient_ids;
              tableData[1].children[0].needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
              tableData[1].children[0].needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
              tableData[1].children[0].needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
            }
            break;
          case 'pr':
            if (item.mode_name) {
              tableData[1].children?.[1].children?.push(new TableRow(item));
            } else {
              tableData[1].children[1].recipientIds = item.recipient_ids;
              tableData[1].children[1].needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
              tableData[1].children[1].needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
              tableData[1].children[1].needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
            }
            break;
          case 'push':
            if (item.mode_name) {
              tableData[1].children?.[2].children?.push(new TableRow(item));
            } else {
              tableData[1].children[2].recipientIds = item.recipient_ids;
              tableData[1].children[2].needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
              tableData[1].children[2].needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
              tableData[1].children[3].needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
            }
            break;
          case 'note':
            if (item.mode_name) {
              tableData[1].children?.[3].children?.push(new TableRow(item));
            } else {
              tableData[1].children[3].recipientIds = item.recipient_ids;
              tableData[1].children[3].needInnerMessageIndeterminate = item.need_inner_message_count > 0 && item.need_inner_message_count < item.recipient_ids.length;
              tableData[1].children[3].needMailIndeterminate = item.need_mail_count > 0 && item.need_mail_count < item.recipient_ids.length;
              tableData[1].children[3].needMessageIndeterminate = item.need_message_count > 0 && item.need_message_count < item.recipient_ids.length;
            }
            break;
        }
      }
    }
  })
}

function resetTableData() {
  tableData[0].needConditions = [];
  tableData[0].recipientIds = [];
  tableData[0].needInnerMessageIndeterminate = false;
  tableData[0].needMailIndeterminate = false;
  tableData[0].needMessageIndeterminate = false;
  tableData[0].children = [];
  tableData[1].needConditions = [];
  tableData[1].needInnerMessageIndeterminate = false;
  tableData[1].needMailIndeterminate = false;
  tableData[1].needMessageIndeterminate = false;
  for (const child of tableData[1].children) {
    child.needConditions = [];
    child.recipientIds = [];
    child.needInnerMessageIndeterminate = false;
    child.needMailIndeterminate = false;
    child.needMessageIndeterminate = false;
  }
}

/* function editRecipient(row: TableRow) {
  if (row.data.source === 'https://eur.openeuler.openatom.cn') {

  }
} */

const currentEditorType = ref<'add' | 'edit'>('add');

// -----------------------eur精细化条件-----------------------
const editEurCondition = reactive({
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
const showEditEurDlg = ref(false);
const eurBuildTopics = [
  { label: '开始', value: 'start' },
  { label: '结束', value: 'end' },
];
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
];
const commaSeparator = /\s*(?:,|，)\s*/;

function confirmAddOrEditEurCondition() {
  (currentEditorType.value === 'add' ? postSubsCondition : putSubsCondition)({
    ...editEurCondition,
    mode_filter: {
      ...editEurCondition.mode_filter,
      name: editEurCondition.mode_filter.name.split(commaSeparator),
      owner: editEurCondition.mode_filter.owner.split(commaSeparator),
    }
  }).then(() => {
    cancelAddEurCondition();
    getData({ page: currentPage.value, pageSize: pageSize.value });
  })
}

function cancelAddEurCondition() {
  showEditEurDlg.value = false;
  editEurCondition.mode_name = '';
  editEurCondition.event_type = '';
  editEurCondition.mode_filter = {
    name: '',
    owner: '',
    topic: [],
    status: [],
  };
}

// -----------------------gitee精细化条件-----------------------
const editGiteeCondition = reactive({
  source: '',
  mode_name: '',
  event_type: '',
  mode_filter: {
    repo_name: [],
    is_bot: false,
  }
});
const showEditGiteeDlg = ref(false);

function confirmAddOrEditGiteeCondition() {
  (currentEditorType.value === 'add' ? postSubsCondition : putSubsCondition)(editGiteeCondition).then(() => {
    cancelAddEurCondition();
    getData({ page: currentPage.value, pageSize: pageSize.value });
  });
}

function cancelAddGiteeCondition() {
  showEditGiteeDlg.value = false;
  editGiteeCondition.mode_name = '';
  editGiteeCondition.event_type = '';
  editGiteeCondition.mode_filter = {
    repo_name: [],
    is_bot: false,
  };
}

// -----------------------添加/编辑/删除精细化条件-----------------------
function addCondition(row: TableRow) {
  switch (row.data.source) {
    case 'https://eur.openeuler.openatom.cn':
      editEurCondition.source = row.data.source;
      editEurCondition.mode_name = row.data.mode_name;
      editEurCondition.event_type = row.data.event_type;
      showEditEurDlg.value = true;
      break;
    case 'https://gitee.com':
      editGiteeCondition.source = row.data.source;
      editGiteeCondition.mode_name = row.data.mode_name;
      editGiteeCondition.event_type = row.data.event_type;
      showEditGiteeDlg.value = true;
      break;
  }
  currentEditorType.value = 'add';
}

function editCondition(row: TableRow) {
  switch (row.data.source) {
    case 'https://eur.openeuler.openatom.cn':
      editEurCondition.source = row.data.source;
      editEurCondition.mode_name = row.data.mode_name;
      editEurCondition.event_type = row.data.event_type;
      editEurCondition.mode_filter = {
        name: row.data.mode_filter.name.join(', '),
        owner: row.data.mode_filter.owner.join(', '),
        topic: row.data.mode_filter.topic,
        status: row.data.mode_filter.status,
      };
      showEditEurDlg.value = true;
      break;
    case 'https://gitee.com':
      editGiteeCondition.source = row.data.source;
      editGiteeCondition.mode_name = row.data.mode_name;
      editGiteeCondition.event_type = row.data.event_type;
      editGiteeCondition.mode_filter = {
        repo_name: row.data.mode_filter.repo_name,
        is_bot: row.data.mode_filter.is_bot,
      };
      showEditGiteeDlg.value = true;
      break;
  }
  currentEditorType.value = 'edit';
}

function deleteCondition(row: TableRow) {

}

// -----------------------修改/添加接收人-----------------------
const showEditRecipientDlg = ref(false);
const editRecipientSource = ref<string>('');
const recipients = ref<{
  recipient_id: string;
  mail: string;
  phone: string;
  remark: string;
}[]>();
const sourceDisplayText: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR消息',
  'https://gitee.com': 'Gitee消息',
}

function editRecipient(row: TableRow) {
  editRecipientSource.value = row.data.source;
  showEditRecipientDlg.value = true;
  // todo 查询
}

function addRecipient() {
  // todo
  showEditRecipientDlg.value = true;
}

function needCheckboxChange(row: TableRow) {
}

// -----------------------分页-----------------------

const multiSelection = ref<TableRow[]>([]);
const handleSelectionChange = (val: TableRow[]) => multiSelection.value = val;
const btnsDisabled = computed(() => multiSelection.value.length === 0);

defineExpose({
  addRecipient,
  editRecipient,
  btnsDisabled
})
</script>

<template>
  <ODialog v-model:visible="showEditEurDlg" :unmount-on-hide="false">
    <template #header>新增EUR消息接收条件</template>
    <p class="dialog-content-title">
      消息条件命名
    </p>
    <div class="dialog-content" style="">
      <OForm class="form" has-required label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="条件名称" required>
          <OInput clearable v-model="editEurCondition.mode_name" style="width: 100%;" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">
        消息条件接收设置（必须至少填写一项）
      </p>
      <OForm class="form" layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="项目名称" >
          <OInput clearable v-model="editEurCondition.mode_filter.name"  style="width: 100%;" />
        </OFormItem>
        <OFormItem label="项目拥有者" >
          <OInput clearable v-model="editEurCondition.mode_filter.owner"  style="width: 100%;" />
        </OFormItem>
        <OFormItem label="构建开始/结束" >
          <OSelect v-model="editEurCondition.mode_filter.topic" multiple variant="outline" placeholder="请选择构建开始/结束" clearable>
            <OOption v-for="item in eurBuildTopics" :key="item.value" :label="item.label" :value="item.value" />
          </OSelect>
        </OFormItem>
        <OFormItem label="构建状态" >
          <OSelect v-model="editEurCondition.mode_filter.status" multiple variant="outline" placeholder="请选择构建开始/结束" clearable>
            <OOption v-for="item in eurBuildStatus" :key="item.value" :label="item.label" :value="item.value" />
          </OSelect>
        </OFormItem>
      </OForm>
    </div>
    <template #footer>
      <div class="dlg-action">
        <OButton color="primary" variant="solid" @click="confirmAddOrEditEurCondition">确定</OButton>
        <OButton @click="cancelAddEurCondition">取消</OButton>
      </div>
    </template>
  </ODialog>

  <ODialog v-model:visible="showEditGiteeDlg" :unmount-on-hide="false">
    <template #header>新增Gitee消息接收条件</template>
    <div class="dialog-content">
      <p class="dialog-content-title">
        消息条件命名
      </p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="条件名称" required>
          <OInput clearable v-model="editGiteeCondition.mode_name" style="width: 100%;" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">
        消息条件命名
      </p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="仓库名称" required>
          <TheEditorWithTags v-model="editGiteeCondition.mode_filter.repo_name" style="width: 100%;" />
        </OFormItem>
        <OFormItem label="提交人" required>
          <div style="display: flex; gap: 16px;">
            <ORadio v-model="editGiteeCondition.mode_filter.is_bot" :value="true">机器人</ORadio>
            <ORadio v-model="editGiteeCondition.mode_filter.is_bot" :value="false">非机器人</ORadio>
          </div>
        </OFormItem>
      </OForm>
    </div>
    <template #footer>
      <div class="dlg-action">
        <OButton color="primary" variant="solid" @click="confirmAddOrEditGiteeCondition">确定</OButton>
        <OButton @click="cancelAddGiteeCondition">取消</OButton>
      </div>
    </template>
  </ODialog>

  <ODialog v-model:visible="showEditRecipientDlg" :unmount-on-hide="false">
    <template #header>修改接收人</template>
    <div class="dialog-content">
      <p style="font-size: 16px; font-weight: bold;">
        消息类型：{{ sourceDisplayText[editRecipientSource] }}
      </p>
      <OButton variant="outline" round="pill" color="primary">新增接收人</OButton>
      <ElTable :data="recipients" style="width: 100%;">
        <ElTableColumn label="姓名"></ElTableColumn>
      </ElTable>
    </div>
  </ODialog>

  <ElTable 
    row-key="id"
    :data="tableData"
    style="width: 100%; margin-top: 24px"
    default-expand-all
    @selection-change="handleSelectionChange"
    :header-row-style="{ background: '#DCE1EF' }"
  >
    <el-table-column type="selection" width="45" />
    <ElTableColumn label="消息类型" prop="name" width="250">
      <template #default="{ row }">
        <div class="first-cell">
          {{ row.name }}
          <img v-if="row.hasAddIcon" @click="addCondition(row)" src="@/assets/svg-icons/icon-add.svg" />
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="站内消息" >
      <template #default="{ row }">
        <OCheckbox v-model="row.needConditions" value="need_inner_message" @change="needCheckboxChange(row)"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="邮箱" >
      <template #default="{ row }">
        <OCheckbox v-model="row.needConditions" value="need_mail" @change="needCheckboxChange(row)"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="短信" >
      <template #default="{ row }">
        <OCheckbox v-model="row.needConditions" value="need_message" @change="needCheckboxChange(row)"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="电话">
      <template #default>
        <OCheckbox :disabled="true" value="1"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="API钩子">
      <template #default>
        <OCheckbox :disabled="true" value="1"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="消息接收人" >
      <template #default="{ row }">
        <p>{{ row.recipientIds.join('、') }}</p>
      </template>
    </ElTableColumn>
    <ElTableColumn label="操作" width="200">
      <template #default="{ row }">
        <div class="table-action">
          <OLink color="primary" @click="editRecipient(row)">修改接收人</OLink>
          <OLink v-if="row.data.mode_name" color="primary" @click="editCondition(row)">修改条件</OLink>
          <OLink v-if="row.data.mode_name" color="danger" @click="deleteCondition(row)">删除</OLink>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>

  <OPagination :total="tableTotal" :page="currentPage" :page-size="pageSize" @change="getData" />
</template>

<style lang="scss" scoped>
:deep(.table-header) {
  background-color: #DCE1EF;
}
:deep(.o-pagination-wrap) {
  margin-top: 32px;
  justify-content: flex-end;
}

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

.first-cell {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;

  img {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

:deep(.cell) {
  display: flex;
  align-items: center;
}
</style>