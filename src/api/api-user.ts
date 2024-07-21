import type { UserInfoT } from '@/@types/type-user';
import { request } from '@/shared/axios';
import { getCsrfToken } from '@/shared/login';

/**
 * code码换token
 * @param {Object} params 查询参数
 * @param {string} params.code code码
 * @param {string} params.redirect_uri 回调地址
 * @returns {Promise<ResponseT>} 用户信息
 */
export function getUserToken(params: { code: string; redirect_uri: string }) {
  const url = '/server/session';
  return request.post(url, params).then((res) => {
    const data = res.data;
    return {
      code: data.code as string,
      msg: data.msg as string,
      data: {
        id: data.data.id as string,
        account: data.data.account as string,
        fullname: data.data.fullname as string,
        description: data.data.description as string,
        email: data.data.email as string,
        avatar_id: data.data.avatar_id as string,
        phone: data.data.phone as string,
        request_delete: data.data.request_delete as boolean,
        request_delete_at: data.data.request_delete_at as number,
        is_disable_admin: data.data.is_disable_admin as boolean,
      },
    };
  });
}

/**
 * 获取id token，构造登出URL
 * @param account 用户名
 * @returns {Promise<ResponseT>} id token
 */
export function getUserIdToken() {
  const url = `/server/session`;
  return request.put(url).then((res) => {
    const data = res.data;
    return {
      code: data.code as string,
      msg: data.msg as string,
      data: {
        id_token: data.data.id_token as string,
      },
    };
  });
}

/**
 * 获取用户信息
 * @param {Object} params 用户信息查询参数
 * @param {string} params.xCsrf csrf token
 * @param {string} params.account 用户名
 * @returns {Promise<ResponseT> } 用户信息
 */
export function getUserInfoByToken() {
  const url = '/server/user';
  return request.get(url).then((res) => {
    const data = res.data;
    return {
      code: data.code as string,
      msg: data.msg as string,
      data: {
        id: data.data.id as string,
        account: data.data.account as string,
        fullname: data.data.fullname as string,
        description: data.data.description as string,
        email: data.data.email as string,
        avatar_id: data.data.avatar_id as string,
        phone: data.data.phone as string,
        request_delete: data.data.request_delete as boolean,
        request_delete_at: data.data.request_delete_at as number,
        is_disable_admin: data.data.is_disable_admin as boolean,
      },
    };
  });
}

/**
 * 获取一个组织或用户的信息
 * @param {string} account 组织或用户的名称
 * @returns {Promise<ResponseT>} 组织或用户信息
 */
export function getAccountInfo(account: string) {
  const url = `/server/account/${account}`;
  return request.get(url, { showError: false }).then((res) => {
    const data = res.data;

    return {
      code: data.code as string,
      msg: data.msg as string,
      data: {
        id: data.data.id as string, // id
        avatar_id: data.data.avatar_id as string, // 头像
        description: data.data.description as string, // 描述
        email: data.data?.email as string, // 邮箱
        fullname: data.data.fullname as string, // 昵称
        account: data.data.account as string, // 用户名
        type: data.data.type as number, // 类型 0-个人 1-组织
        default_role: data.data?.default_role as string, // 组织的默认权限
        owner: data.data?.owner as string, // 所属者
        website: data.data?.website as string, // 相关链接
        allow_request: data.data?.allow_request as boolean, // 是否允许用户加入
      },
    };
  });
}

/**
 * 注销服务
 */
export function deleteUser() {
  const url = '/server/user';
  return request.delete(url, { showError: false }).then((res) => {
    return res.data;
  });
}

interface UserPermissionResponseT {
  msg: string;
  code: number;
  data: UserInfoT;
}

/**
 * 获取用户信息
 * @param community community字段，默认openeuler
 * @returns {Promise<UserInfoT>} 用户信息
 */
export function queryUserInfo(community = 'openeuler') {
  const url = '/api-id/oneid/user/permission';
  const token = getCsrfToken();
  return request
    .get<UserPermissionResponseT>(url, {
      params: { community },
      global: true,
      headers: { token },
    })
    .then((res) => res.data.data);
}

