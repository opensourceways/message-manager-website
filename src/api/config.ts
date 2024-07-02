import { request } from "@/shared/axios";
import type { Recipient, Subscribe } from "@/@types/type-config";
import type { PagedResponse, Pagination } from "@/@types/types-common";
import dayjs from "dayjs";
import { isArray } from "@opensig/opendesign";
import { generateQuery } from "@/utils/common";

export function getRecipients(page = 1, count_per_page = 10): Promise<Pagination<Recipient>> {
  const query = generateQuery({ count_per_page, page });
  return request.get<PagedResponse<Recipient>>(`message_center/config/recipient${query}`)
    .then(res => {
      const { count: total, query_info } = res.data;
      if (isArray(query_info) && query_info.length) {
        for (const item of query_info) {
          item.formattedCreateTime = dayjs(item.created_at).format("YYYY/MM/DD HH:mm:ss");
          item.key = item.recipient_id;
        }
        return { total, data: query_info };
      }
      return { total: 0, data: [] };
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

export function getSubscribes(page = 1, count_per_page = 10): Promise<Pagination<Subscribe>> {
  const query = generateQuery({ count_per_page, page });
  return request.get<PagedResponse<Subscribe>>(`message_center/config/subs${query}`)
    .then(res => {
      const { count: total, query_info } = res.data;
      if (isArray(query_info) && query_info.length) {
        return { total, data: query_info };
      }
      return { total: 0, data: [] };
    });
}

export function postEurCondition(data: any) {
  return request.post('/message_center/config/subs', data);
}