<script setup lang="ts">
import type { Recipient } from '@/@types/type-config';
import { getRecipients } from '@/api/config';
import { OInput, OLink, OPagination, OTab, OTabPane, OTable } from '@opensig/opendesign';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const activeTab = ref('a');
const pageSizes = ref([10, 20, 50]);
const pageSize = ref(pageSizes.value[0]);
const currentPage = ref(1);
const tableTotal = ref(0);
const tableColumns = [
  { label: t('config.table.recipient_id'), key: 'recipient_id' },
  { label: t('config.table.mail'), key: 'mail' },
  { label: t('config.table.phone'), key: 'phone' },
  { label: t('config.table.remark'), key: 'remark' },
  { label: t('config.table.createTime'), key: 'formattedCreateTime' },
  { label: t('config.table.operation'), key: 'operation' },
];
const tableData = ref<Recipient[]>([]);
const isAddingRecipient = ref(false);
const newData = reactive({
  recipient_id: '',
  mail: '',
  phone: '',
  remark: ''
})

watch(
  [currentPage, pageSize],
  ([page, pageSize]) => {
    getRecipients(page, pageSize).then(({ total, data }) => {
      tableData.value = data;
      tableTotal.value = total;
    }).catch(() => {
      tableData.value = [];
      tableTotal.value = 0;
    });
  },
  { immediate: true });

function confirmAdd() {
  
}

function cancelAdd() {
  isAddingRecipient.value = false;
}
</script>

<template>
  <div class="page-body">
    <header>
      <p class="title">{{ $t('config.subscribeConfig') }}</p>
    </header>

    <OTab v-model="activeTab" style="margin-top: 23px;">
      <OTabPane value="a" :label="$t('config.receiveConfig')">

      </OTabPane>
      <OTabPane value="b" :label="$t('config.receiverManagement')">
        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
          <button class="add-receiver" @click="isAddingRecipient = true">新建接收人</button>
          <p v-html="$t('config.desc')"></p>
        </div>

        <OTable :columns="tableColumns" :data="tableData" style="margin-top: 12px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: var(--table-radius)">
          <template #body="{ body }">
            <tr v-for="(row, rIdx) in body" :key="row.key || rIdx" :class="{ last: !isAddingRecipient && (rIdx + 1 === tableData.length) }">
              <td v-for="(col, idx) in row.data" :key="col.key || idx" :rowspan="col.rowspan" :colspan="col.colspan" :class="{ last: col.last }">
                <div v-if="col.key === 'operation'" class="row space-between" style="margin-right: 16px;">
                  <OLink color="primary" @click="confirmAdd">修改接收人</OLink>
                  <OLink color="danger" @click="confirmAdd" style="margin-left: 48px;">删除</OLink>
                </div>
                <span v-else>
                  {{ col.value }}
                </span>
              </td>
            </tr>
            <tr v-if="isAddingRecipient">
              <td><OInput v-model="newData.recipient_id" placeholder="请输入姓名" clearable style="width: 160px" /></td>
              <td><OInput v-model="newData.mail" placeholder="请输入邮箱" clearable style="width: 160px" /></td>
              <td><OInput v-model="newData.phone" placeholder="请输入手机" clearable style="width: 160px" /></td>
              <td><OInput v-model="newData.remark" placeholder="请输入备注" clearable style="width: 160px" /></td>
              <td></td>
              <td>
                <div class="row space-between" style="margin-right: 16px;">
                  <OLink color="primary" @click="confirmAdd">保存</OLink>
                  <OLink color="primary" @click="cancelAdd" style="margin-left: 16px;">取消</OLink>
                </div>
              </td>
            </tr>
          </template>
        </OTable>
        <OPagination :total="tableTotal" v-model:page="currentPage" v-model:page-size="pageSize" :page-sizes="pageSizes" style="margin-top: 32px;"/>
      </OTabPane>
    </OTab>

  </div>
</template>

<style scoped lang="scss">
$default-page-body-width: 1416px;
$default-page-body-height: 900px;

.row {
  display: flex;
}

.space-between {
  justify-content: space-between;
}

.page-body {
  --tab-nav-justify: left;
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
  }

  .title {
    font-size: 40px;
    font-weight: medium;
  }
}

.add-receiver {
  border: 1px solid #002EA7;
  background-color: #FFF;
  color: #002EA7;
  font-size: 16px;
  height: 40px;
  padding: 8px 16px;
  border-radius: 20px;
}
</style>