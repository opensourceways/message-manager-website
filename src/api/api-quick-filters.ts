import { request } from '@/shared/axios';
import type { FilterRuleT } from '@/@types/type-filter';
import type { PagedResponseT } from '@/@types/types-common';

/**
 * 获取快捷筛选项
 * @returns 快捷筛选项
 */
export function getFilterRules(): Promise<FilterRuleT[]> {
  return request.get<{ query_info: FilterRuleT[] }>('/message_center/config/subs').then((res) => res?.data.query_info ?? []);
}

/**
 * 获取所有快捷筛选项
 */
export const getAllFilters = () => {
  return request.get<PagedResponseT<FilterRuleT>>('/message_center/config/subs/all').then((res) => res.data.query_info ?? []);
};

/**
 * 重命名快捷筛选
 */
export function putFilterRule(data: { source: string; old_name: string; new_name: string }) {
  return request.put('/message_center/config/subs', data);
}

/**
 *
 * 删除快捷筛选
 * @param source 消息源
 * @param mode_name 快捷筛选名
 * @param event_type 事件类型
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
 * 更新邮箱勾选
 * @param filterId 快捷筛选id
 * @param recipient_id 当前用户接收人id
 * @returns 调用结果
 */
export function updateMailStatus(filterIds: string[], recipient_id: string, need_mail = true) {
  return request.put('/message_center/config/push', {
    need_message: false,
    need_phone: false,
    need_inner_message: true,
    need_mail,
    recipient_id,
    subscribe_id: filterIds,
  });
}
