import { request } from '@/shared/axios';
import type { MessageT, MySig, Sig } from '@/@types/type-messages';
import type { PagedResponseT } from '@/@types/types-common';

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
  return request.put(
    '/message_center/inner',
    msgs.map((msg) => msg.event_id)
  );
}

/**
 * 删除消息
 * @param msgs 消息列表
 */
export function deleteMessages(...msgs: MessageT[]): Promise<any> {
  return request.delete('/message_center/inner', {
    data: msgs.map((msg) => msg.event_id),
  });
}

export function getAllSigs() {
  return request.get<{ data: Sig[] }>('/api-dsapi/query/sig/info?community=openeuler&search=fuzzy').then((res) => res.data.data);
}

export function getRepoList() {
  return request.get<{ data: string[] }>('/api-dsapi/query/sig/repo?community=openeuler&search=fuzzy').then((res) => res.data.data);
}

export function getMySigs(loginName: string) {
  return request.get<{ data: MySig[] }>(`/api-dsapi/query/user/ownertype?community=openeuler&user=${loginName}`).then((res) => res.data.data);
}

export function getMyRepos(loginName: string) {
  return request.get<{ data: string[] }>(`/api-dsapi/query/user/owner/repos?community=openeuler&user=${loginName}`).then((res) => res.data.data);
}

/**
 * 保存快捷筛选
 */
export function saveRule(rule: Record<string, any>) {
  return request.post('/message_center/config/subs_new', rule);
}

interface ReqParamT {
  page_num: number;
  count_per_page: number;
  start_time?: number;
  is_read?: boolean;
}

/**
 * 快捷筛选查询消息
 */
export function filterByRule(params: { source: string; mode_name: string; page: number; count_per_page: number }, abort?: AbortController) {
  return request.get<PagedResponseT<MessageT>>('/message_center/inner_quick', { params, signal: abort?.signal, ignoreDuplicates: true });
}

export function getForumSystem(params: ReqParamT, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/forum/system', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getForumAbout(params: ReqParamT & { is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/forum/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getMeetingTodo(params: ReqParamT & { gitee_user_name: string; filter: 0 | 1 | 2 }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/meeting/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getCveTodo(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/cve/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getCve(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/cve', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getIssueTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/issue/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getPrTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/pr/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getGiteeAbout(params: ReqParamT & { gitee_user_name: string; is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getGitee(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getEur(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/eur', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getAllTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getAllAbout(params: ReqParamT & { gitee_user_name: string; is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getAllWatch(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/watch', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

export function getUnreadCount(giteeUserName?: string) {
  return request
    .get<{ count: Record<string, number> }>('/message_center/inner/count_new', { params: { gitee_user_name: giteeUserName } })
    .then((res) => res.data);
}
