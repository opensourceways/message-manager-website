import { isClient, useMessage } from '@opensig/opendesign';
const message = useMessage();

/**
 * 时间戳转 xxxx/xx/xx 格式时间
 * @param {number} timestamp 待转换时间戳
 * @returns {string} 返回格式化时间，如 2024/01/01
 */
export const changeTimeStamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000);

  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);

  return `${year}/${month}/${day}`;
};


/**
 * 判断 key 是否存在于目标对象上
 * @param {(string|number|symbol)} key 待判断 key
 * @param {object} obj 目标对象
 * @returns {boolean} 存在返回 true，不存在返回 false
 */
export const isValidKey = (key: string | number | symbol, obj: object): key is keyof typeof obj => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * 统一处理创建、删除成功后的跳转
 * @param {Function} fn 回调函数
 * @param {string} msg 成功提示信息
 */
export const redirectAfterRepoAction = (fn: () => void, msg: string) => {
  message.success({
    content: msg,
  });
  setTimeout(() => {
    fn();
  }, 300);
};

/**
 * 滚动至顶部
 * @param {number} top 滑动到的顶部
 * @param {boolean} mooth 是否平滑滑动
 */
export const scrollToTop = (top: number = 0, smooth: boolean = true) => {
  if (isClient) {
    const dom = document.querySelector('#app > .o-scroller > .o-scroller-container');
    dom?.scrollTo({
      top,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }
};

/**
 * URL参数转对象
 * @param {string} url 地址
 * @returns {(string|undefined)} 转换成功返回参数对象，失败返回 undefined
 */
export function getUrlParams(url: string) {
  const arrObj = url.split('?');
  if (arrObj.length > 1) {
    const arrPara = arrObj[1].split('&');
    const list = {} as any;
    for (let i = 0; i < arrPara.length; i++) {
      const item = arrPara[i].split('=');
      const key = item[0];
      const value = item[1];
      list[key] = value;
    }
    return list;
  }
}
