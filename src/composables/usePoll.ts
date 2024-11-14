import type { Awaitable } from '@vueuse/core';

export default (delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  let hasNext = true;
  let currentPoll: AsyncGenerator;
  let abortController: AbortController;

  const wait = () => {
    return new Promise<void>((resolve) => {
      abortController.signal.addEventListener('abort', () => {
        resolve();
        clearTimeout(timeout);
      });
      timeout = setTimeout(resolve, delay);
    });
  };

  const stop = async () => {
    if (abortController) {
      abortController.abort();
    }
    hasNext = false;
    if (currentPoll) {
      await currentPoll.next();
    }
  };

  const start = <T>(api: (val: AbortController) => Promise<T>, onFailed?: (err: any) => Awaitable<void>) => {
    hasNext = true;
    const generatorFn = async function* () {
      while (hasNext) {
        abortController = new AbortController();
        try {
          yield await api(abortController);
        } catch (error) {
          if (abortController.signal.aborted) {
            hasNext = false;
            return;
          }
          if (onFailed) {
            await onFailed(error);
          }
        }
        await wait();
      }
    };
    const res = generatorFn();
    currentPoll = res;
    return res;
  };

  return { start, stop };
};
