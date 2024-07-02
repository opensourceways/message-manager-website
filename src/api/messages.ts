import { request, type AxiosResponse } from "@/shared/axios";
import type { MessageT } from "@/@types/type-messages";
import { isArray } from "@opensig/opendesign";
import dayjs from "dayjs";
import type { PagedResponse, Pagination } from "@/@types/types-common";
import { generateQuery } from "@/utils/common";

function setMsgIdAndFormatTime(res: AxiosResponse<PagedResponse<MessageT>>): Pagination<MessageT> {
  const { count: total, query_info } = res.data
  if (isArray(query_info) && query_info.length) {
    for (const msg of query_info) {
      msg.id = msg.source + msg.event_id;
      msg.formattedTime = dayjs(msg.time).format('MM/DD HH:mm');
    }
    return { total, data: query_info };
  }
  return { total: 0, data: [] };
}

/**
 * 获取所有消息
 * @param source 消息来源
 * @param event_type 消息类型
 * @param is_read 是否已读
 * @param page 页码
 * @param count_per_page 每页数量
 * @returns { Promise<MessageT[]> } 所有消息
 */
export function getMessages(source?: string, event_type?: string, is_read?: 1 | 0, page = 1, count_per_page = 10): Promise<Pagination<MessageT>> {
  const query = generateQuery({ source, event_type, is_read, count_per_page, page });
  return request.get<PagedResponse<MessageT>>(`/message_center/inner${query}`).then(setMsgIdAndFormatTime);
}

export function readMessages(...msgs: MessageT[]): Promise<void> {
  return request.put('/message_center/inner/', msgs.map(msg => ({ source: msg.source, event_id: msg.event_id })));
}

export function deleteMessages(...msgs: MessageT[]): Promise<any> {
  return request.delete('/message_center/inner/', {
    data: msgs.map(msg => ({ source: msg.source, event_id: msg.event_id }))
  });
}

export function getUnreadCount(): Promise<number> {
  return request.get('/message_center/inner/count').then(res => res.data.count).catch(() => 0);
}