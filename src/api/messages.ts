import { request } from "@/shared/axios";
import type { MessageT, MsgQueryParamT } from "@/@types/type-messages";
import type { PagedResponseT } from "@/@types/types-common";

/**
 * 获取所有消息
 * @param params 查询参数
 * @returns { Promise<MessageT[]> } 所有消息
 */
export function getMessages(params: MsgQueryParamT) {
  return request.get<PagedResponseT<MessageT>>(`/message_center/inner`, { params, ignoreDuplicates: true });
}

/**
 * 标记消息为已读
 * @param msgs 消息列表
 */
export function readMessages(...msgs: MessageT[]): Promise<void> {
  return request.put('/message_center/inner', msgs.map(msg => ({ source: msg.source, event_id: msg.event_id })));
}

/**
 * 删除消息
 * @param msgs 消息列表
 */
export function deleteMessages(...msgs: MessageT[]): Promise<any> {
  return request.delete('/message_center/inner', {
    data: msgs.map(msg => ({ source: msg.source, event_id: msg.event_id }))
  });
}

/**
 * 获取未读消息数量
 * @param msgs 消息列表
 */
export function getUnreadCount(): Promise<number> {
  return request.get('/message_center/inner/count').then(res => res.data.count).catch(() => 0);
}