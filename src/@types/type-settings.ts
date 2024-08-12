export type RecipientT = {
  key?: string | number; // key，用在表格组件上，非后端字段
  id: string | number; // id
  recipient_id: string; // 接收人姓名
  mail: string; // 邮箱
  phone: string; // 手机号
  displayPhone?: string; // 前端处理后展示的手机号，非后端字段
  remark: string; // 备注
}

export interface EurModeFilterT {
  source_group: string[]; // 项目名称
  status: number[]; // 构建状态
}

export interface GiteeModeFilterT {
  repo_name: string[]; // 仓库名
  is_bot?: 'true' | 'false'; // 是否是机器人，后端传来的是字符串的true|false，前端传过去是boolean
}

export type ModeFilterT = EurModeFilterT | GiteeModeFilterT;

/**
 * 消息接收规则
 */
export interface SubscribeRuleT<T = ModeFilterT> {
  id: string; // id
  source: string; // 事件来源
  event_type: string; // 事件类型
  mode_name: string; // 精细化订阅条件名称
  spec_version: string; // 版本
  mode_filter: T; // 精细化订阅条件
  recipient_id: number; // 接收人id
  recipient_name: string; // 接收人名称
  need_message?: boolean; // 接收短信多选框状态
  need_phone?: boolean; // 接收电话多选框状态
  need_mail?: boolean; // 接收邮件多选框状态
  need_inner_message?: boolean; // 接收站内消息多选框状态
  
  eventTypes?: string[]; // 非后端字段，用于前端处理展示
  needCheckboxes?: string[]; // 站内消息、电话、短信等多选框的数组，非后端字段，用于前端处理展示
  ids: string[]; // 多个事件类型的数据合并到一条后，记录多个的id，非后端字段，用于前端处理
}
