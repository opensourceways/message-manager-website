import { isClient, useMessage } from '@opensig/opendesign';
const message = useMessage();

/**
 * 获取指定时区偏移量的年份
 * @param offset - 时区偏移量（单位：小时）。例如，UTC+8 时区，传入 8。
 * @returns - 指定时区偏移量对应的年份
 */
export function getYearByOffset(offset = 8) {
  // 获取当前时间的 UTC 时间
  const now = new Date();
  const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

  // 设置偏移
  utcTime.setHours(utcTime.getHours() + offset);

  return utcTime.getFullYear();
}

/**
 * safe window open
 */
export const windowOpen = (url?: string | URL | undefined, target?: string | undefined, features?: string | undefined) => {
  const opener = window.open(url, target, features);
  opener && (opener.opener = null);
};

// 检查是否是同域名
export const checkOriginLink = (path: string) => {
  return path.includes('openeuler.org');
};

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

/**
 * 对比两个数组，输出区别及相同元素
 * @param sourceArr 原数组
 * @param targetArr 目标数组
 */
export function diff<T>(sourceArr: T[], targetArr: T[]) {
  const oldListRemains = Array.from({ length: sourceArr.length });
  const added: T[] = [];
  const same: T[] = [];
  for (const obj of targetArr) {
    let found = false;
    for (let i = 0; i < sourceArr.length; i++) {
      if (!oldListRemains[i] && obj === sourceArr[i]) {
        oldListRemains[i] = true;
        same.push(obj);
        found = true;
        break;
      }
    }
    if (!found) added.push(obj);
  }
  const removed = sourceArr.filter((_, i) => !oldListRemains[i]);
  return {
    added,
    removed,
    same,
  };
}

/**
 * 根据某规则去重
 * @param arr 数组
 * @param uniqueRule 根据去重
 * @param handleDuplicate 遇到重复时操作
 * @returns 去重后数组
 */
export function uniqueBy<T>(arr: T[], uniqueRule: (val: T) => any, handleDuplicate?: (val: T, duplicate: T) => T) {
  const map = new Map<any, T>();
  arr.forEach((item) => {
    const key = uniqueRule(item);
    const cached = map.get(key);
    if (cached) {
      if (handleDuplicate) {
        map.set(key, handleDuplicate(cached, item));
      }
      return;
    }
    map.set(key, item);
  });
  return [...map.values()];
}
