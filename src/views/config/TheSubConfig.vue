<script setup lang="ts">
import { OButton, OCheckbox, ODialog, OForm, OFormItem, OInput, OLink, OOption, ORadio, OSelect, OPagination } from '@opensig/opendesign';
import { computed, reactive, ref, watch } from 'vue';
import { deleteSubsCondition, getAllSubs, getSubscribes, postSubsCondition, putSubsCondition, updateNeedStatus } from '@/api/config';
import type { Subscribe } from '@/@types/type-config';
import TheEditorWithTags from './components/TheEditorWithTags.vue';
import TheRecipientTableDialog from './components/TheRecipientTableDialog.vue';
import { subsSettingsRowNamesGenerator, subscribeSettingsInitialData } from '@/data/subscribeSettings';
import { treeDataIterator } from '@/utils/common';


class SubscribSettingsTableRow {
  id: any;
  name: string;
  needCheckboxes: string[] = [];
  recipientIds?: string;
  children: SubscribSettingsTableRow[] = [];
  hasAddIcon?: boolean;
  data: Subscribe;

  constructor(data: Subscribe) {
    this.id = data.id;
    if (data.mode_name) {
      this.name = data.mode_name;
    } else {
      this.hasAddIcon = true;
      this.name = subsSettingsRowNamesGenerator[data.source][data.event_type || 'default']();
    }
    this.data = data;
  }
}

const generateInitialRows = (data: any[]) => {
  let level = 0;
  return data.map(function recursion(item, index) {
    const res = new SubscribSettingsTableRow(item);
    res.id = `${level}-${index}`;
    if (item.children) {
      level++;
      res.children = item.children.map(recursion);
    }
    return res;
  });
}

// -----------------------初始数据-----------------------
const tableData = reactive<SubscribSettingsTableRow[]>(generateInitialRows(subscribeSettingsInitialData));


// -----------------------查询数据-----------------------
function getData() {
  resetTableData();
  getAllSubs().then(({ data }) => {
    const parentRowMap = new Map<string, SubscribSettingsTableRow>();
    treeDataIterator(
      tableData,
      row => parentRowMap.set(row.data.source + (row.data.event_type ?? ''), row)
    );
    for (const item of data.query_info) {
      let row: SubscribSettingsTableRow | undefined;
      if (item.event_type) {
        row = parentRowMap.get(item.source + item.event_type);
        if (item.mode_name) {
          row?.children.push(new SubscribSettingsTableRow(item));
          continue;
        }
      } else {
        row = parentRowMap.get(item.source);
      }
      if (row) {
        row.id = item.id;
        row.data = item;
      }
    }
  }).then(() => getDetailData());
}

function getDetailData() {
  getSubscribes().then(data => {
    const map = new Map<number | string, Subscribe>();
    for (const item of data) {
      let cached = map.get(item.id);
      if (!cached) {
        cached = item;
        cached.recipientNames = [item.recipient_name as string];
        map.set(item.id, cached);
      } else {
        cached.recipientNames?.push(item.recipient_name as string);
      }
    }
    const idRowMap = new Map<string, SubscribSettingsTableRow>();
    treeDataIterator(tableData, row => idRowMap.set(row.id, row));
    for (const item of map.values()) {
      const row = idRowMap.get(item.id);
      if (!row) {
        continue;
      }
      row.recipientIds = item.recipientNames?.join('、');
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
  });
}

function resetTableData() {
  tableData.forEach(function recursion(row) {
    row.needCheckboxes = [];
    row.recipientIds = '';
    if (!row.data.mode_name && row.data.event_type) {
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
    getData();
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
  editGiteeCondition.mode_filter.repo_name = repoNameEditor.value.getTagValues();
  (currentEditorType.value === 'add' ? postSubsCondition : putSubsCondition)(editGiteeCondition).then(() => {
    cancelAddEurCondition();
    getData();
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
function addCondition(row: SubscribSettingsTableRow) {
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

function editCondition(row: SubscribSettingsTableRow) {
  switch (row.data.source) {
    case 'https://eur.openeuler.openatom.cn':
      editEurCondition.source = row.data.source;
      editEurCondition.mode_name = row.data.mode_name;
      editEurCondition.event_type = row.data.event_type;
      editEurCondition.mode_filter = {
        name: row.data.mode_filter.name?.join(', ') ?? '',
        owner: row.data.mode_filter.owner?.join(', ') ?? '',
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
        repo_name: row.data.mode_filter.repo_name ?? '',
        is_bot: row.data.mode_filter.is_bot,
      };
      showEditGiteeDlg.value = true;
      break;
  }
  currentEditorType.value = 'edit';
}

const showDeleteDlg = ref(false);
const deletedRow = ref<SubscribSettingsTableRow>();

function deleteCondition(row: SubscribSettingsTableRow) {
  deletedRow.value = row;
  showDeleteDlg.value = true;
}

async function confirmDelete() {
  if (!deletedRow.value) {
    return;
  }
  await deleteSubsCondition({
    source: deletedRow.value.data.source,
    event_type: deletedRow.value.data.event_type,
    mode_name: deletedRow.value.data.mode_name,
  });
  cancelDelete();
  getData();
}

function cancelDelete() {
  showDeleteDlg.value = false;
  deletedRow.value = undefined;
}

// -----------------------表格多选-----------------------
const multiSelection = ref<SubscribSettingsTableRow[]>([]);
const handleSelectionChange = (val: SubscribSettingsTableRow[]) => multiSelection.value = val;
const btnsDisabled = computed(() => multiSelection.value.length === 0);
const isAddingRecipient = ref(false);

function handleExternalAddRecipient() {
  editRecipientTargetRows.value = multiSelection.value;
  showEditRecipientDlg.value = true;
  isAddingRecipient.value = true;
}

// -----------------------修改/添加接收人-----------------------
const showEditRecipientDlg = ref(false);
const editRecipientTargetRows = ref<SubscribSettingsTableRow[]>([]);

function editRecipient(row: SubscribSettingsTableRow) {
  editRecipientTargetRows.value = [row];
  showEditRecipientDlg.value = true;
}

// -----------------------移除接收人-----------------------
const removingRecipients = ref(false);

function removeRecipients() {
  if (!multiSelection.value.length) {
    return;
  }
  editRecipientTargetRows.value = multiSelection.value;
  removingRecipients.value = true;
  showEditRecipientDlg.value = true;
}

watch(showEditRecipientDlg, val => {
  if (!val) {
    getData();
    editRecipientTargetRows.value = [];
    removingRecipients.value = false;
  }
});

// -----------------------接收方式勾选框状态更改-----------------------
function needCheckboxChange(row: SubscribSettingsTableRow) {
  Promise.all((row.data.recipientNames as string[]).map((id: string) => updateNeedStatus(row.needCheckboxes, id, row.data.id)))
}

defineExpose({
  handleExternalAddRecipient,
  removeRecipients,
  btnsDisabled
})
</script>

<template>
  <ODialog v-model:visible="showDeleteDlg" size="small">
    <template #header>删除条件</template>
    <div style="display: flex; justify-content: center;">
      是否删除{{ deletedRow?.name }}
    </div>
    <template #footer>
      <div class="dlg-action">
        <OButton color="primary" variant="solid" @click="confirmDelete">确定</OButton>
        <OButton @click="cancelDelete">取消</OButton>
      </div>
    </template>
  </ODialog>

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
    <TheRecipientTableDialog
      :add="isAddingRecipient"
      :is-in-remove-dialog="removingRecipients"
      :effectedRows="editRecipientTargetRows"
      :isShowingDialog="showEditRecipientDlg"
    ></TheRecipientTableDialog>
  </ODialog>

  <ElTable 
    row-key="id"
    :data="tableData"
    style="width: 100%; margin-top: 24px"
    default-expand-all
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="45" />
    <ElTableColumn label="消息类型" prop="name" width="200">
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