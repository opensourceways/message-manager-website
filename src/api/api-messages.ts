import { request } from "@/shared/axios";
import type { MessageT, MySig, Sig } from "@/@types/type-messages";
import type { PagedResponseT } from "@/@types/types-common";

/**
 * 获取所有消息
 * @param params 查询参数
 * @returns { Promise<MessageT[]> } 所有消息
 */
export function getMessages(params: Record<string, any>, abort?: AbortController) {
  return request.post<PagedResponseT<MessageT>>(`/message_center/inner`, params, { signal: abort?.signal, ignoreDuplicates: true });
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
export function getUnreadCount() {
  return request.get<{ count: { source: string, count: number }[] }>('/message_center/inner/count').then(res => res.data.count).catch(() => []);
}

export function getAllSigs() {
  return request.get<{ data: Sig[] }>('/api-dsapi/query/sig/info?community=openeuler&search=fuzzy').then(res => res.data.data);
}

export function getRepoList() {
  return request.get<{ data: string[] }>('/api-dsapi/query/sig/repo?community=openeuler&search=fuzzy').then(res => res.data.data);
}

export function getMySigs(loginName: string) {
  return request.get<{ data: MySig[] }>(`/api-dsapi/query/user/ownertype?community=openeuler&user=${loginName}`).then(res => res.data.data);
}

export function getMyRepos(loginName: string) {
  return request.get<{ data: string[] }>(`/api-dsapi/query/user/owner/repos?community=openeuler&user=${loginName}`).then(res => res.data.data);
}

/**
 * 保存过滤规则
 */
export function saveRule(rule: Record<string, any>) {
  return request.post('/message_center/config/subs_new', rule);
}

/**
 * 
 */
export function filterByRule(params: { source: string, mode_name: string, page: number, count_per_page: number }, abort?: AbortController) {
  return request.get<PagedResponseT<MessageT>>('/message_center/inner_quick', { params, signal: abort?.signal, ignoreDuplicates: true });
}