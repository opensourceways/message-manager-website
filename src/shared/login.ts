import Cookies from 'js-cookie';

import { getUserInfoByToken, getUserToken, getUserIdToken } from '@/api/api-user';
import { useLoginStore, useUserInfoStore } from '@/stores/user';
import type { UserInfoT } from '@/@types/type-user';

import { getCurrentLocale } from '@/utils/locale';

const APP_ID = import.meta.env.VITE_APP_ID;
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;
const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL;
const COOKIE_DOMAIN = import.meta.env.VITE_COOKIE_DOMAIN;
const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME;

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

// 登录存储字段
export const LOGIN_KEYS = {
  CSRF_COOKIE: XSRF_COOKIE_NAME,
  ONEID_U_T_: '_U_T_',
  ONEID_Y_G_: '_Y_G_',
};

// code码正则匹配
export const LOGIN_REG = /[\?|\&]code=([0-9a-zA-Z]{32})&state=([0-9a-zA-Z]{32})$/;

// 修改pinia登录状态
const setStatus = (status: LoginStatusT) => {
  const loginStore = useLoginStore();
  loginStore.setLoginStatus(status);
};

// 获取url回调参数
export const getUrlQuery = (url = window.location.search) => {
  const query: { [key: string]: string } = {};
  const arr = url.match(LOGIN_REG);

  if (arr) {
    query.code = arr[1];
    query.state = arr[2];
  }

  return query;
};

// code换token
const getUserTokenByCode = async (code: string) => {
  // 去掉url中的code
  const newUrl = window.location.href.replace(LOGIN_REG, '');

  try {
    setStatus(LOGIN_STATUS.DOING);
    const res = await getUserToken({ code, redirect_uri: newUrl });
    if (res && res.data) {
      window.history.replaceState({}, '', newUrl);
      afterLogined(res.data);
    } else {
      setStatus(LOGIN_STATUS.FAILED);
      clearUserAuth();

      const { code, state } = getUrlQuery();
      if (code && state) {
        window.location.href = newUrl;
      }
    }
  } catch (err) {
    setStatus(LOGIN_STATUS.FAILED);
    clearUserAuth();

    const { code, state } = getUrlQuery();
    if (code && state) {
      window.location.href = newUrl;
    }
  }
};

// 获取用户认证凭据
export function getUserAuth() {
  return {
    csrfCookie: Cookies.get(LOGIN_KEYS.CSRF_COOKIE),
  };
}

// 清除用户认证凭据
export function clearUserAuth() {
  // 清除内存中用户信息
  const userInfoStore = useUserInfoStore();
  userInfoStore.$reset();
  // 清除cookie
  Cookies.remove(LOGIN_KEYS.CSRF_COOKIE);
  Cookies.remove(LOGIN_KEYS.ONEID_U_T_, { domain: COOKIE_DOMAIN });
  Cookies.remove(LOGIN_KEYS.ONEID_Y_G_, { domain: COOKIE_DOMAIN });
}

// 登录之后的回调
const afterLogined = (userInfo: UserInfoT) => {
  const { id } = userInfo;

  if (!id) {
    setStatus(LOGIN_STATUS.FAILED);
    clearUserAuth();
  }

  setStatus(LOGIN_STATUS.DONE);

  const userInfoStore = useUserInfoStore();
  userInfoStore.$patch(userInfo);
};

// 退出
export async function doLogout(token?: string) {
  try {
    let id_token = '';
    if (token) {
      id_token = token;
    } else {
      const idTokenRes = await getUserIdToken();

      const { id_token: idToken } = idTokenRes.data;
      id_token = idToken;
    }

    const redirectUri = `${window.location.origin}/`;

    if (id_token) {
      setStatus(LOGIN_STATUS.NOT);
      window.location.href = `${LOGOUT_URL}/logout?redirect_uri=${redirectUri}`;
    }
  } catch (error) {
    setStatus(LOGIN_STATUS.NOT);
    clearUserAuth();
    window.location.href = window.location.origin;
  }
}

// 获取用户信息
export async function requestUserInfo() {
  const { csrfCookie } = getUserAuth();
  if (csrfCookie) {
    try {
      setStatus(LOGIN_STATUS.DOING);
      const res = await getUserInfoByToken();
      if (res && res.data) {
        afterLogined(res.data);
      } else {
        setStatus(LOGIN_STATUS.FAILED);
        clearUserAuth();
      }
    } catch (err) {
      setStatus(LOGIN_STATUS.FAILED);
      clearUserAuth();
    }
  }
}

// 尝试登录
export async function tryLogin() {
  const query = getUrlQuery();
  const auth = getUserAuth();

  const { code, state } = query;
  const { csrfCookie } = auth;
  if (code && state) {
    // 如果存在code码，则用code码换token
    await getUserTokenByCode(code);
    return LOGIN_MODE.CODE;
  } else if (csrfCookie) {
    // 如果存在token，则请求用户信息
    await requestUserInfo();
    return LOGIN_MODE.CACHE;
  }
}

// 登录
export async function doLogin() {
  const lang = getCurrentLocale();
  try {
    window.location.href = `${LOGIN_URL}/oneid/oidc/authorize?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(
      window.location.href
    )}&response_type=code&scope=openid+profile+email+phone+address+username+id_token${lang === 'zh' ? '' : '&lang=en'}`;
  } catch (error) {
    setStatus(LOGIN_STATUS.FAILED);
    clearUserAuth();
  }
}

// 注册
export async function doRegister() {
  const lang = getCurrentLocale();
  window.location.href = `${LOGIN_URL}/oneid/oidc/authorize?entity=register&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(
    window.location.href
  )}&response_type=code&scope=openid+profile+email+phone+address+username+id_token${lang === 'zh' ? '' : '&lang=en'}`;
}
