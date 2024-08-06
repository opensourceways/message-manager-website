import Cookies from 'js-cookie';
import { queryUserInfo } from '../api/api-user';
import { useLoginStore, useUserInfoStore } from '../stores/user';

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;

// 登录状态
export enum LOGIN_STATUS {
  FAILED = -1, // 登录失败
  NOT = 0, // 未登录
  DOING = 1, // 登录中
  DONE = 2, // 登录成功
}
export type LoginStatusT = typeof LOGIN_STATUS.FAILED | LOGIN_STATUS.NOT | LOGIN_STATUS.DOING | LOGIN_STATUS.DONE;

// 登录模式
export enum LOGIN_MODE {
  CODE = 'code', // Code码
  CACHE = 'cache', // 缓存
}
export type LoginModeT = typeof LOGIN_MODE.CODE | LOGIN_MODE.CACHE;

export const LOGIN_KEYS = {
  CSRF_TOKEN: '_U_T_',
  USER_INFO: '_U_I_',
};

/**
 * 从cookie中获取csrfToken
 * @returns csrfToken
 */
export const getCsrfToken = () => Cookies.get(LOGIN_KEYS.CSRF_TOKEN) || '';

// 退出登录
export function logout() {
  location.href = `${LOGIN_URL}/logout?redirect_uri=${encodeURIComponent(window?.location?.origin)}`;
}

/**
 * 跳转登录页
 */
export function doLogin() {
  location.href = `${LOGIN_URL}/login?redirect_uri=${encodeURIComponent(location.href)}`;
}

// 清除用户认证凭据
export function clearUserAuth() {
  // 清除内存中用户信息
  useUserInfoStore().$reset();
  // 清除cookie
  Cookies.remove(LOGIN_KEYS.CSRF_TOKEN);
}

/**
 * 尝试登录
 * @returns 登录结果
 */
export async function tryLogin() {
  const userInfoStore = useUserInfoStore();
  const loginStore = useLoginStore();
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    userInfoStore.$reset();
    loginStore.setLoginStatus(LOGIN_STATUS.NOT);
    return;
  }
  try {
    loginStore.setLoginStatus(LOGIN_STATUS.DOING);
    userInfoStore.$patch(await queryUserInfo());
    loginStore.setLoginStatus(LOGIN_STATUS.DONE);
  } catch (error) {
    loginStore.setLoginStatus(LOGIN_STATUS.FAILED);
  }
}