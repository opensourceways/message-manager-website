/**
 * 消息接收规则
 */
export interface FilterRuleT {
  /** id */
  id: string;
  /** 事件来源 */
  source: string;
  /** 事件类型 */
  event_type: string;
  /** 精细化订阅条件名称 */
  mode_name: string;
  /** 版本 */
  spec_version: string;
  is_default: boolean;
  web_filter: Record<string, any>;
}
