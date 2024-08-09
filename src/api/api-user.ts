import { request } from '@/shared/axios';
import type { UserInfoT } from '@/@types/type-user';

interface UserPermissionResponseT {
  msg: string;
  code: number;
  data: UserInfoT;
}

/**
 * 获取用户信息
 * @param community community字段，默认openeuler
 * @returns 用户信息
 */
export function queryUserInfo() {
  const url = '/api-id/oneid/personal/center/user?community=openeuler';
  return request.get<UserPermissionResponseT>(url).then((res) => res.data.data);
}

/**
 * 同步当前登录的用户信息到消息中心后端
 * @param userInfo 用户信息
 * @returns 用户的recipient_id
 */
export function syncUserInfo(userInfo: UserInfoT) {
  const gitee_user_name = userInfo.identities?.find((item) => item.identity === 'gitee')?.user_name;
  return request
    .post<{ newId: number }>('/message_center/config/recipient/sync', {
      mail: userInfo.email,
      phone: userInfo.phone,
      user_name: userInfo.username,
      country_code: userInfo.phoneCountryCode,
      gitee_user_name,
    })
    .then((res) => res.data.newId);
}
