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
 * @returns {Promise<UserInfoT>} 用户信息
 */
export function queryUserInfo() {
  const url = '/api-id/oneid/personal/center/user?community=openeuler';
  return request
    .get<UserPermissionResponseT>(url)
    .then((res) => res.data.data);
}

export function syncUserInfo(userInfo: UserInfoT) {
  return request.post('/message_center/config/recipient/sync', {
    mail: userInfo.email,
    phone: userInfo.phone,
    user_name: userInfo.username,
    country_code: userInfo.phoneCountryCode,
  });
}