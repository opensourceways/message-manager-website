<script setup lang="ts">
import { OButton, OCheckbox, ODialog, OForm, OFormItem, OInput, OLink, OOption, ORadio, OSelect, OPagination, OTable } from '@opensig/opendesign';
import { computed, reactive, ref } from 'vue';
import { getSubscribes, postSubsCondition, putSubsCondition, updateNeedStatus } from '@/api/config';
import type { Subscribe } from '@/@types/type-config';
import TheEditorWithTags from './components/TheEditorWithTags.vue';

const currentPage = ref(1);
const pageSize = ref(10);
const tableTotal = ref(0);

class TableRow {
  id: any;
  name: string;
  needCheckboxes: string[] = [];
  recipientIds?: string;
  children: TableRow[];
  hasAddIcon?: boolean;
  data: any;

  constructor(data: any, name?: string, hasAddIcon?: boolean, children?: TableRow[]) {
    this.id = data.id;
    this.hasAddIcon = hasAddIcon;
    this.children = children ?? [];
    this.name = name ?? data.mode_name;
    this.data = data;
    this.recipientIds = data.recipient_ids?.join('、') ?? '';
    if (data.need_inner_message) {
      this.needCheckboxes.push('need_inner_message');
    }
    if (data.need_mail) {
      this.needCheckboxes.push('need_mail');
    }
    if (data.need_message) {
      this.needCheckboxes.push('need_message');
    }
  }
}

// -----------------------初始数据-----------------------
const tableData = reactive<TableRow[]>([
  new TableRow({
    source: 'https://eur.openeuler.openatom.cn',
    event_type: 'build',
    id: 'EUR',
  }, 'EUR消息', true),
  new TableRow({
    source: 'https://gitee.com',
    id: 'GITEE',
  }, 'Gitee消息', true, [
    new TableRow({
      source: 'https://gitee.com',
      event_type: 'issue',
      id: 'ISSUE',
    }, 'Issue事件', true),
    new TableRow({
      source: 'https://gitee.com',
      event_type: 'pr',
      id: 'PR',
    }, 'Pull Request事件', true),
    new TableRow({
      source: 'https://gitee.com',
      event_type: 'push',
      id: 'PUSH',
    }, 'Push事件', true),
    new TableRow({
      source: 'https://gitee.com',
      event_type: 'note',
      id: 'NOTE',
    }, '评论事件', true),
  ]),
]);

// ------------------获取固定的父标题的id------------------
Promise.all([
  postSubsCondition({ source: 'https://eur.openeuler.openatom.cn', event_type: 'build' }, { ignoreDuplicates: true }),
  postSubsCondition({ source: 'https://gitee.com' }, { ignoreDuplicates: true }),
  postSubsCondition({ source: 'https://gitee.com', event_type: 'issue' }, { ignoreDuplicates: true }),
  postSubsCondition({ source: 'https://gitee.com', event_type: 'pr' }, { ignoreDuplicates: true }),
  postSubsCondition({ source: 'https://gitee.com', event_type: 'push' }, { ignoreDuplicates: true }),
  postSubsCondition({ source: 'https://gitee.com', event_type: 'note' }, { ignoreDuplicates: true }),
]).then(([ eur, gitee, issue, pr, push, note ]) => {
  tableData[0].id = eur.data.newId || eur.data.exist.id;
  tableData[1].id = gitee.data.newId || gitee.data.exist.id;
  tableData[1].children[0].id = issue.data.newId || issue.data.exist.id;
  tableData[1].children[1].id = pr.data.newId || pr.data.exist.id;
  tableData[1].children[2].id = push.data.newId || push.data.exist.id;
  tableData[1].children[3].id = note.data.newId || note.data.exist.id;
});

// -----------------------查询数据-----------------------
function getData(val = { page: 1, pageSize: 10 }) {
  getSubscribes(val.page, val.pageSize).then(({ total, data }) => {
    tableTotal.value = total;
    const map = new Map<number | string, Subscribe & Record<string, any>>();
    for (const item of data) {
      let cached = map.get(item.id);
      if (!cached) {
        cached = item;
        cached.recipient_ids = [item.recipient_id];
        map.set(item.id, cached);
      } else {
        cached.recipient_ids.push(item.recipient_id);
      }
    }
    resetTableData();
    for (const item of map.values()) {
      let row: TableRow | undefined;
      if (item.source === 'https://eur.openeuler.openatom.cn') {
        row = tableData[0];
      }
      if (item.source === 'https://gitee.com') {
        switch (item.event_type) {
          case 'issue':
            row = tableData[1].children[0];
            break;
          case 'pr':
            row = tableData[1].children[1];
            break;
          case 'push':
            row = tableData[1].children[2];
            break;
          case 'note':
            row = tableData[1].children[3];
            break;
          default:
            row = tableData[1];
        }
      }
      if (!row) {
        continue;
      }
      if (item.mode_name) {
        row.children?.push(new TableRow(item));
        continue;
      }
      row.recipientIds = item.recipient_ids.join('、');
      if (item.need_inner_message) {
        row.needCheckboxes.push('need_inner_message');
      }
      if (item.need_mail) {
        row.needCheckboxes.push('need_mail');
      }
      if (item.need_message) {
        row.needCheckboxes.push('need_message');
      }
    }
  })
}
getData();

function resetTableData() {
  tableData.forEach(function recursion(row) {
    row.needCheckboxes = [];
    row.recipientIds = '';
    if (row.data.source !== 'https://gitee.com') {
      row.children = [];
    }
    if (row.children) {
      row.children.forEach(recursion);
    }
  });
}

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
const repoNameEditor = ref();
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
  editGiteeCondition.mode_filter.repo_name = repoNameEditor.value.getTagValues().split(commaSeparator);
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
const recipientTableColumns = [
  { label: '姓名', key: 'name' },
  { label: '邮箱', key:'mail' },
  { label: '手机', key: 'phone' },
  { label: '备注', key:'remark' },
];
const editRecipientTarget = reactive({
  id: '',
  source: '',
  event_type: '',
  name: '',
});
const recipients = ref<{
  recipient_id: string;
  mail: string;
  phone: string;
  remark: string;
}[]>();
const SOURCE: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR消息',
  'https://gitee.com': 'Gitee消息',
}

function editRecipient(row: TableRow) {
  editRecipientTarget.id = row.id;
  editRecipientTarget.source = row.data.source;
  editRecipientTarget.event_type = row.data.event_type;
  editRecipientTarget.name = row.name;
  showEditRecipientDlg.value = true;
  // todo 查询
}

function addRecipient() {
  // todo
  showEditRecipientDlg.value = true;
}

// -----------------------接收方式勾选框状态更改-----------------------
function needCheckboxChange(row: TableRow) {
  Promise.all(row.data.recipient_ids.map((id: string) => updateNeedStatus(row.needCheckboxes, id, row.data.id)))
}

// -----------------------表格多选-----------------------
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
    <div class="dialog-content">
      <p class="dialog-content-title">
        消息条件命名
      </p>
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
          <OInput clearable v-model="editGiteeCondition.mode_name" style="width: 100%;" placeholder="请输入方便您区分的名称" />
        </OFormItem>
      </OForm>
      <p class="dialog-content-title">
        消息条件命名
      </p>
      <OForm class="form" has-required layout="h" label-align="top" label-justify="left" label-width="20%">
        <OFormItem label="仓库名称" required>
          <TheEditorWithTags ref="repoNameEditor" style="width: 100%;" placeholder="请输入仓库名称" />
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

  <ODialog v-model:visible="showEditRecipientDlg" :unmount-on-hide="false" size="large">
    <template #header>修改接收人</template>
    <div class="recipient-editor-content">
      <p style="font-size: 16px; font-weight: bold;">
        消息类型：{{ SOURCE[editRecipientTarget.source] }}/{{ editRecipientTarget.name }}
      </p>
      <p style="width: fit-content">
        <OButton variant="outline" round="pill" color="primary" >新增接收人</OButton>
      </p>
      <OTable :columns="recipientTableColumns" :data="recipients">
        <template #td_name="{ row }">
          {{ row.name }}
        </template>
        <template #td_mail="{ row }">
          {{ row.mail }}
        </template>
        <template #td_phone="{ row }">
          {{ row.phone }}
        </template>
        <template #td_remark="{ row }">
          {{ row.remark }}
        </template>
      </OTable>
    </div>
  </ODialog>

  <ElTable 
    row-key="id"
    :data="tableData"
    style="width: 100%; margin-top: 24px"
    default-expand-all
    @selection-change="handleSelectionChange"
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
        <OCheckbox v-model="row.needCheckboxes" value="need_inner_message" @change="needCheckboxChange(row)"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="邮箱" >
      <template #default="{ row }">
        <OCheckbox v-model="row.needCheckboxes" value="need_mail" @change="needCheckboxChange(row)"/>
      </template>
    </ElTableColumn>
    <ElTableColumn label="短信" >
      <template #default="{ row }">
        <OCheckbox v-model="row.needCheckboxes" value="need_message" @change="needCheckboxChange(row)"/>
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
        <p>{{ row.recipientIds }}</p>
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

.recipient-editor-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
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