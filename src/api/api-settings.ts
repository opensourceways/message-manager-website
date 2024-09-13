import { request, type RequestConfig } from '@/shared/axios';
import type { FilterRuleT } from '@/@types/type-settings';
import type { PagedResponseT } from '@/@types/types-common';

/**
 * 获取快捷筛选项
 * @returns 快捷筛选项
 */
export function getFilterRules(): Promise<FilterRuleT[]> {
  return request.get<{ query_info: FilterRuleT[] }>('/message_center/config/subs').then((res) => res?.data.query_info ?? []);
}

/**
 * 获取所有消息接收规则标题（不包含接收人信息）
 * @returns 消息接收规则标题（不包含接收人信息）
 */
export const getAllSubs = () => {
  return request.get<PagedResponseT<FilterRuleT>>('/message_center/config/subs/all').then((res) => res.data.query_info ?? []);
};

/**
 * 新增消息接受规则
 * @param data 消息接收规则
 * @param config axios设置
 * @returns 新增项的id
 */
export function postSubsRule(data: Partial<FilterRuleT>, config?: RequestConfig) {
  return request.post<{ newId: number[] }>('/message_center/config/subs', Object.assign(data, { spec_version: '1.0' }), config).then((res) => res.data);
}

/**
 * 重命名快捷筛选
 */
export function putFilterRule(data: {
  source: string;
  old_name: string;
  new_name: string;
}) {
  return request.put('/message_center/config/subs', Object.assign(data));
}

/**
 * 
 * 删除消息接收规则
 * @param data 消息接收规则
 * @returns 调用结果
 */
export function deleteFilterRule(source: string, mode_name: string, event_type: string) {
  return request.delete('/message_center/config/subs', {
    data: {
      source,
      event_type,
      mode_name,
    },
  });
}

/**
 * 消息接收设置，接受规则内接收方式多选框状态改变时调用
 *
 * @param needStatus 接收方式数组
 * @param recipient_id 接收人ID
 * @param subscribe_id 接受规则id
 * @returns 调用结果
 */
/* export function updateNeedStatus(rule: FilterRuleT) {
  const data: Record<string, any> = {
    need_inner_message: false,
    need_mail: false,
    need_message: false,
    need_phone: false,
    recipient_id: rule.recipient_id.toString(),
    subscribe_id: rule.ids.map(Number),
  };
  rule.needCheckboxes?.forEach((item) => (data[item] = true));
  return request.put('/message_center/config/push', data);
} */

/* export function postPushConfig(data: any) {
  return request.post('/message_center/config/push', data, { ignoreDuplicates: true });
} */
