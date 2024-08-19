export interface MessageT {
  id: string;
  event_id: string;
  source: string;
  source_url: string;
  source_group: string;
  spec_version: string;
  summary: string;
  time: string;
  formattedTime: string;
  title: string;
  type: string;
  user: string;
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