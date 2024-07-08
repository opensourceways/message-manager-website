// TODO:考虑文件重命名，当前config易与项目config重复
export default {
  subscribeConfig: '消息订阅设置',
  receiveConfig: '消息接收设置',
  receiverManagement: '接收人管理',
  desc: '新增接收人后，系统将自动<span style="font-weight: bold;">发送验证信息</span>到所填手机号和邮箱，通过验证<span style="font-weight: bold;">并在消息接受设置页面分配消息接收人</span>后，方可接收对应类别的消息',// TODO:建议使用i18n插槽
  table: {
    recipient_id: '接收人姓名',
    mail: '邮箱',
    phone: '手机',
    remark: '备注',
    createTime: '创建时间',
    operation: '操作',
  }
}