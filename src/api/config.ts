import { request, type RequestConfig } from '@/shared/axios';
import type { Recipient, Subscribe } from '@/@types/type-config';
import type { PagedResponse, Pagination } from '@/@types/types-common';
// TODO:外部三方件引入建议放顶层
import dayjs from 'dayjs';
import { isArray } from '@opensig/opendesign';
import { generateQuery } from '@/utils/common';

// TODO: api请按js-doc给出注释规范
export function getRecipients(page = 1, count_per_page = 10): Promise<Pagination<Recipient>> {
  const query = generateQuery({ count_per_page, page });
  return request.get<PagedResponse<Recipient>>(`message_center/config/recipient${query}`).then((res) => {
    const { count: total, query_info } = res.data;
    if (isArray(query_info) && query_info.length) {
      for (const item of query_info) {
        item.formattedCreateTime = dayjs(item.created_at).format('YYYY/MM/DD HH:mm:ss');
        item.key = item.recipient_id;
      }
      return { total, data: query_info };
    }
    return { total: 0, data: [] };
  });
}
// TODO: api请按js-doc给出注释规范
export function addRecipient(data: Partial<Recipient>) {
  return request.post('/message_center/config/recipient', data);
}
// TODO: api请按js-doc给出注释规范
export function deleteRecipient(recipient_id: string) {
  return request.delete('/message_center/config/recipient/', { data: { recipient_id } });
}
// TODO: api请按js-doc给出注释规范
export function editRecipient(data: Partial<Recipient>) {
  return request.put('/message_center/config/recipient', data);
}
// TODO: api请按js-doc给出注释规范
export function getSubscribes(page = 1, count_per_page = 10): Promise<Pagination<Subscribe>> {
  const query = generateQuery({ count_per_page, page });
  return request.get<PagedResponse<Subscribe>>(`message_center/config/subs${query}`).then((res) => {
    const { count: total, query_info } = res.data;
    if (isArray(query_info) && query_info.length) {
      return { total, data: query_info };
    }
    return { total: 0, data: [] };
  });
}
// TODO: api请按js-doc给出注释规范
export function postSubsCondition(data: any, config?: RequestConfig) {
  // TODO:考虑对象解构复制数组
  return request.post('/message_center/config/subs', Object.assign(data, { spec_version: '1.0' }), config);
}
// TODO: api请按js-doc给出注释规范
export function putSubsCondition(data: any) {
  return request.put('/message_center/config/subs', Object.assign(data, { spec_version: '1.0' }), data);
}
// TODO: api请按js-doc给出注释规范
export function deleteSubsCondition(id: string) {}
// TODO: api请按js-doc给出注释规范
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
