import { request } from '@/shared/axios';
import type { MessageT } from '@/@types/type-messages';
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
export function readMessages(...eventIds: string[]): Promise<void> {
  return request.put('/message_center/inner', eventIds);
}

/**
 * 删除消息
 * @param msgs 消息列表
 */
export function deleteMessages(...eventIds: string[]): Promise<any> {
  return request.delete('/message_center/inner', { data: eventIds });
}

/**
 * 保存快捷筛选
 */
export function saveRule(rule: Record<string, any>) {
  return request.post('/message_center/config/subs_new', rule);
}

interface ReqParamT {
  page_num: number; // 页数
  count_per_page: number; // 一页大小
  start_time?: number; // 时间筛选
  is_read?: boolean; // 是否已读
}

/**
 * 获取我关注的论坛消息
 */
export function getForumSystem<T extends ReqParamT>(params: T, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/forum/system', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取提到我的论坛消息
 */
export function getForumAbout(params: ReqParamT & { is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/forum/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取关于未参加会议消息
 */
export function getMeetingTodo(params: ReqParamT & { gitee_user_name: string; filter: 0 | 1 | 2 }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/meeting/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取未处理cve消息
 */
export function getCveTodo(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/cve/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取关于我关注的cve消息
 */
export function getCve(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/cve', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取未处理issue消息
 */
export function getIssueTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/issue/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取未处理PR消息
 */
export function getPrTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/pr/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取提到我的gitee消息
 */
export function getGiteeAbout(params: ReqParamT & { gitee_user_name: string; is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取我关注的gitee消息
 */
export function getGitee(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/gitee', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取我关注的eur消息
 */
export function getEur(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/eur', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取全部未处理消息
 */
export function getAllTodo(params: ReqParamT & { is_done: boolean; gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/todo', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取全部提到我的
 */
export function getAllAbout(params: ReqParamT & { gitee_user_name: string; is_bot?: boolean }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/about', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 获取全部我关注的
 */
export function getAllWatch(params: ReqParamT & { gitee_user_name: string }, abortController: AbortController) {
  return request
    .get<PagedResponseT<MessageT>>('/message_center/inner/watch', { params, signal: abortController.signal, ignoreDuplicates: true })
    .then((res) => res.data);
}

/**
 * 未读消息数
 */
export function getUnreadCount(giteeUserName?: string) {
  return request
    .get<{ count: Record<string, number> }>('/message_center/inner/count_new', { params: { gitee_user_name: giteeUserName } })
    .then((res) => res.data);
}
