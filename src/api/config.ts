import { request } from "@/shared/axios";
import type { Recipient } from "@/@types/type-config";
import type { PagedResponse, Pagination } from "@/@types/types-common";
import dayjs from "dayjs";
import { isArray } from "@opensig/opendesign";
import { generateQuery } from "@/utils/common";

export function getRecipients(offset_page = 1, count_per_page = 10): Promise<Pagination<Recipient>> {
  offset_page--;
  const query = generateQuery({ offset_page, count_per_page });
  return request.get<PagedResponse<Recipient>>(`message_center/config/recipient${query}`)
      .then(res => {
        const { count: total, query_info } = res.data;
        if (isArray(query_info) && query_info.length) {
          for (const item of query_info) {
            item.formattedCreateTime = dayjs(item.created_at).format("YYYY/MM/DD HH:mm:ss");
            item.key = item.recipient_id;
          }
          return { total, data: query_info }
        }
        return { total: 0, data: [] }
      });
}

export function addRecipient(data: Partial<Recipient>) {
  return request.post('/message_center/config/recipient', data);
}

export function deleteRecipient(recipient_id: string) {
  return request.delete('/message_center/config/recipient/', { data: { recipient_id } });
}

export function editRecipient(data: Partial<Recipient>) {
  return request.put('/message_center/config/recipient', data);
}