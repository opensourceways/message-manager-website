import { isClient, useMessage } from '@opensig/opendesign';
const message = useMessage();

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
 * @param compareFn 比较函数
 * @returns diff结果
 */
export function diff<T>(
  sourceArr: T[],
  targetArr: T[],
  compareFn: (source: T, target: T) => boolean = (a, b) => a === b
): { value: T; type?: 'add' | 'delete' }[] {
  const m = sourceArr.length;
  const n = targetArr.length;
  if (m === 0 && n > 0) {
    return targetArr.map((item) => ({ value: item, type: 'add' }));
  }
  if (m > 0 && n === 0) {
    return sourceArr.map((item) => ({ value: item, type: 'delete' }));
  }
  const max = m + n;
  const v = new Map<number, number>();
  v.set(1, 0);
  outer: for (let d = 0; d <= max; d++) {
    for (let k = -d; k <= d; k += 2) {
      let down = false;
      let prevX: number;
      if (k === -d || (k !== d && (v.get(k + 1) as number) > (v.get(k - 1) as number))) {
        down = true;
        prevX = v.get(k + 1) as number;
      } else {
        prevX = v.get(k - 1) as number;
      }
      let x = down ? prevX : prevX + 1;
      let y = x - k;
      while (x < m && y < n && compareFn(sourceArr[x], targetArr[y])) {
        x++;
        y++;
      }
      v.set(k, x);
      if (x === m && y === n) {
        break outer;
      }
    }
  }
  const res: { value: T; type?: 'add' | 'delete' }[] = [];
  let x = m;
  let y = n;
  while (x > 0 && y > 0) {
    if (compareFn(sourceArr[x - 1], targetArr[y - 1])) {
      res.unshift({ value: sourceArr[x - 1] });
      x--;
      y--;
      continue;
    }
    const k = x - y;
    if ((v.get(k + 1) as number) > (v.get(k - 1) as number)) {
      res.unshift({ value: targetArr[y - 1], type: 'add' });
      y--;
    } else {
      res.unshift({ value: sourceArr[x - 1], type: 'delete' });
      x--;
    }
  }
  while (x > 0) {
    res.unshift({ value: sourceArr[x - 1], type: 'delete' });
    x--;
  }
  while (y > 0) {
    res.unshift({ value: targetArr[y - 1], type: 'add' });
    y--;
  }
  return res;
}
