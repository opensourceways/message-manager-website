export interface MessageT {
  /** 消息id */
  id: string;
  /** 事件id */
  event_id: string;
  /** 事件源 */
  source: string;
  /** 跳转url */
  source_url: string;
  /** 仓库/项目 */
  source_group: string;
  spec_version: string;
  /** 消息内容 */
  summary: string;
  /** 消息时间 */
  time: string;
  /** 格式化后的时间，非后端字段，只在前端显示 */
  formattedTime: string;
  title: string;
  /** 事件类型 */
  type: string;
  user: string;
  /** 是否已读 */
  is_read: boolean;
}

export interface MeetingSummary {
  /** 结束时间 */
  End: string;
  /** 会议ID */
  Mid: string;
  /** 日期 */
  Date: string;
  /** 开始时间 */
  Start: string;
  /** 标题 */
  Topic?: string;
  /** 会议链接 */
  JoinUrl?: string;
  /** 发起人 */
  Sponsor?: string;
  /** etherpad链接 */
  Etherpad?: string;
  /** sig组 */
  GroupName: string;
  /** 会议平台 */
  Mplatform?: string;
  /** 详情 */
  Agenda?: string;
  /** 已过期 */
  deprecated?: boolean;
}
