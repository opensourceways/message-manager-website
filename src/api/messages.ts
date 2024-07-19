import { request } from "@/shared/axios";
import type { MessageT } from "@/@types/type-messages";
import type { PagedResponseT } from "@/@types/types-common";
import { generateQuery } from "@/utils/common";

/**
 * 获取所有消息
 * @param source 消息来源
 * @param event_type 消息类型
 * @param is_read 是否已读
 * @param page 页码
 * @param count_per_page 每页数量
 * @returns { Promise<MessageT[]> } 所有消息
 */
export function getMessages(source?: string, event_type?: string, is_read?: 1 | 0, page = 1, count_per_page = 10) {
  const query = generateQuery({ source, event_type, is_read, count_per_page, page });
  return request.get<PagedResponseT<MessageT>>(`/message_center/inner${query}`);
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