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
  state: () => {
    return {
      id: '', // id
      account: '', // 账号
      fullname: '', // 昵称
      email: '', // 邮箱
      description: '', // 个人简介
      avatar_id: '', // 头像
      phone: '', // 手机号
      request_delete: false, // 注销状态
      request_delete_at: 0, // 头像
      is_disable_admin: false, // 是否有下架权限
    };
  },
});

export const useSimpleUserInfoStore = defineStore('simpleUserInfo', {
  state: () => {
    return {
      nickname: '',
      photo: '',
      username: '',
    };
  },
});
