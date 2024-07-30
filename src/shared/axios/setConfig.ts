import type { AxiosStatic } from 'axios';

const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME;
const XSRF_HEADER_NAME = import.meta.env.VITE_XSRF_HEADER_NAME;

/**
 * @param {axios} axios实例
 * @param {config} 自定义配置对象，可覆盖掉默认的自定义配置
 */
export default (axios: AxiosStatic, config = {}) => {
  const defaultConfig = {
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    xsrfCookieName: XSRF_COOKIE_NAME,
    xsrfHeaderName: XSRF_HEADER_NAME,
  };
  Object.assign(axios.defaults, defaultConfig, config);
  return axios;
};
