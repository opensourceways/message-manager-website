import type { UserInfoT } from '@/@types/type-user';
import { LOGIN_STATUS, type LoginStatusT } from '@/shared/login';
import { defineStore } from 'pinia';

/**
 * 登录状态
 */
export const useLoginStore = defineStore('login', {
  state: () => {
    return {
      loginStatus: LOGIN_STATUS.NOT,
    };
  },
  actions: {
    setLoginStatus(status: LoginStatusT) {
      this.loginStatus = status;
    },
  },
  getters: {
    // 登录失败
    isLoginFailed(): boolean {
      return this.loginStatus === LOGIN_STATUS.FAILED;
    },
    // 未登录
    isLoginNot(): boolean {
      return this.loginStatus === LOGIN_STATUS.NOT;
    },
    // 登录中
    isLoggingIn(): boolean {
      return this.loginStatus === LOGIN_STATUS.DOING;
    },
    // 登录成功
    isLogined(): boolean {
      return this.loginStatus === LOGIN_STATUS.DONE;
    },
  },
});

/**
 * 用户基本信息
 */
export const useUserInfoStore = defineStore('userInfo', {
  state: (): UserInfoT => ({
    photo: '',
    username: '',
    email: '',
    phoneCountryCode: '',
    phone: '',
    identities: [],
    recipientId: undefined,
  }),
  getters: {
    giteeLoginName(state) {
      return state.identities.find((id) => id.identity === 'gitee')?.login_name;
    },
  },
});
