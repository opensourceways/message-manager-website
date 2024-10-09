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

export interface CommonMsgQueryParamT {
  /** 消息来源 */
  source?: string;
  /** 消息类型 */
  event_type?: string;
  /** 已读 */
  is_read?: 1 | 0;
  /** 页数 */
  page?: number;
  /** 页大小 */
  count_per_page?: number;
  /** 搜索gitee仓库/eur项目关键字 */
  key_word?: string;
  /** 是否特别关注消息 */
  is_special?: string;
}

export interface EurMsgQueryParamT extends CommonMsgQueryParamT {
  /** eur构建状态 */
  build_status?: string;
}

export interface GiteeMsgQueryParamT extends CommonMsgQueryParamT {
  /** gitee消息是否机器人 */
  is_bot?: string;
  sig?: string;
  repos?: string;
}

export type MsgQueryParamT = EurMsgQueryParamT | GiteeMsgQueryParamT;

export interface Sig {
  sig_name: string;
  repos: string[];
}

export interface MySig {
  sig: string;
  type: string[];
}