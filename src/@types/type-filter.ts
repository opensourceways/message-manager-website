/**
 * 消息接收规则
 */
export interface FilterRuleT {
  /** id */
  id: number;
  /** 事件来源 */
  source: string;
  /** 事件类型 */
  event_type: string;
  /** 快捷筛选名称 */
  mode_name: string;
  /** 版本 */
  spec_version: string;
  /** 是默认筛选 */
  is_default: boolean;
  /** 所有的筛选项 */
  web_filter: Record<string, any>;
  /** 是否需要发邮件 */
  need_mail: boolean;
}
