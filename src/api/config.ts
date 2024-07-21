import { request, type RequestConfig } from '@/shared/axios';
import type { RecipientT, SubscribeRuleT } from '@/@types/type-settings';
import type { PagedResponseT } from '@/@types/types-common';
import { isArray } from '@opensig/opendesign';
import { generateQuery } from '@/utils/common';

/**
 * 获取接收人列表
 * @param page 页码
 * @param count_per_page 每页数量
 * @returns 接收人数组
 */
export function getRecipients(page = 1, count_per_page = 10): Promise<PagedResponseT<RecipientT>> {
  const query = generateQuery({ count_per_page, page });
  return request.get<PagedResponseT<RecipientT>>(`message_center/config/recipient${query}`).then((res) => {
    const { count, query_info } = res.data;
    if (isArray(query_info) && query_info.length) {
      for (const item of query_info) {
        item.key = item.id;
        item.displayPhone = item.phone.substring(0, 6) + '****' + item.phone.substring(10);
      }
      return { count, query_info };
    }
    return { count: 0, query_info: [] };
  });
}

/**
 * 删除接收人
 * @param recipient_id 接收人ID
 * @returns 调用结果
 */
export function addRecipient(data: Partial<RecipientT>, showError = false) {
  return request.post('/message_center/config/recipient', { ...data, message: data.phone }, { showError });
}

/**
 * 删除接收人
 * @param recipient_id 接收人ID
 * @returns 调用结果
 */
export function deleteRecipient(recipient_id: string) {
  return request.delete('/message_center/config/recipient', { data: { recipient_id } });
}

/**
 * 编辑接收人信息
 * @param data 接收人信息
 * @returns 调用结果
 */
export function editRecipient(data: Partial<RecipientT>) {
  return request.put('/message_center/config/recipient', { ...data, message: data.phone });
}

/**
 * 获取所有消息接收规则（包含接收人信息）
 * @returns 消息接收规则（包含接收人信息）
 */
export function getSubsDetail(): Promise<SubscribeRuleT[]> {
  return request.get<{ query_info: SubscribeRuleT[] }>('message_center/config/subs').then((res) => res?.data.query_info ?? []);
}

/**
 * 获取所有消息接收规则标题（不包含接收人信息）
 * @returns 消息接收规则标题（不包含接收人信息）
 */
export const getAllSubs = () => {
  return request.get<PagedResponseT<SubscribeRuleT>>('/message_center/config/subs/all').then((res) => res.data.query_info ?? []);
};

/**
 * 新增消息接受规则
 * @param data 消息接收规则
 * @param config axios设置
 * @returns 调用结果
 */
export function postSubsRule(data: Partial<SubscribeRuleT>, config?: RequestConfig) {
  return request.post('/message_center/config/subs', Object.assign(data, { spec_version: '1.0' }), config);
}

/**
 * 修改消息接收规则
 * @param data 消息接收规则
 * @returns 调用结果
 */
export function putSubsRule(data: Partial<SubscribeRuleT>) {
  return request.put('/message_center/config/subs', Object.assign(data, { spec_version: '1.0' }));
}

/**
 * 删除消息接收规则
 * @param data 消息接收规则
 * @returns 调用结果
 */
export function deleteSubsRule(data: Pick<SubscribeRuleT, 'mode_name' | 'source' | 'event_type'>) {
  return request.delete('/message_center/config/subs', { data });
}

/**
 * 消息接收设置，接受规则内接收方式多选框状态改变时调用
 * 
 * @param needStatus 接收方式数组
 * @param recipient_id 接收人ID
 * @param subscribe_id 接受规则id
 * @returns 调用结果
 */
export function updateNeedStatus(needStatus: string[], recipient_id: string, subscribe_id: string) {
  const data: any = {
    need_inner_message: false,
    need_mail: false,
    need_message: false,
    need_phone: false,
    recipient_id,
    subscribe_id,
  };
  needStatus.forEach((item) => (data[item] = true));
  return request.put('/message_center/config/push', data);
}

export function postPushConfg(data: any) {
  return request.post('/message_center/config/push', data, { ignoreDuplicates: true });
}

/**
 * 删除接收人的订阅
 *
 * 消息接受设置修改接收人 -> 接收人列表取消勾选时调用
 * @param data
 * @returns
 */
export function deletePushConfg(data: { recipient_id: number; subscribe_id: number }) {
  return request.delete('/message_center/config/push', {
    ignoreDuplicates: true,
    data,
  });
}

/**
 * 根据消息接收ID查询接收人
 * @param subscribeIds 消息接收规则ID数组
 * @returns 接收人
 */
export function getSubscribedRecipients(subscribeIds: string[]) {
  const q = generateQuery({ subscribe_id: subscribeIds.join(',') });
  return request.get<PagedResponseT<RecipientT>>(`message_center/config/push${q}`).then(res => res.data);
}
