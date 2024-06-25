import type { AxiosResponse } from 'axios';
// import { reportAPIPerformance } from '@/shared/analytics'

export default (response: AxiosResponse) => {
  // 上报接口性能
  // reportAPIPerformance(response);

  return response;
};
