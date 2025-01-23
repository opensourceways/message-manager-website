import { OpenAnalytics, OpenEventKeys, getClientInfo } from '@opensig/open-analytics';
import { reportAnalytics } from '@/api/api-analytics';
import type { Awaitable } from '@vueuse/core';

export const oa = new OpenAnalytics({
  appKey: 'openEuler',
  request: (data) => {
    reportAnalytics(data);
  },
});

export const enableOA = () => {
  oa.setHeader(getClientInfo());
  oa.enableReporting(true);
};

export const disableOA = () => {
  oa.enableReporting(false);
};

/**
 * @param event 事件名
 * @param eventData 上报数据
 * @param $service service字段取值
 * @param options options
 */
export const oaReport = <T extends Record<string, any>>(
  event: string,
  eventData?: T | ((...opt: any[]) => Awaitable<T>),
  $service = 'message',
  options?: {
    immediate?: boolean;
    eventOptions?: any;
  }
) => {
  return oa.report(
    event,
    async () => ({
      $service,
      ...(typeof eventData === 'function' ? await eventData() : eventData),
    }),
    options
  );
};

export const reportPV = ($referrer?: string) => {
  oaReport(OpenEventKeys.PV, $referrer ? { $referrer } : undefined);
};

export const reportPerformance = () => {
  oaReport(OpenEventKeys.LCP);
  oaReport(OpenEventKeys.INP);
  oaReport(OpenEventKeys.PageBasePerformance);
};
