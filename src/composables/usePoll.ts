export default (delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  let hasNext = false;
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

  const start = <T = any>(api: (val: AbortController) => Promise<T>) => {
    if (hasNext) {
      return currentPoll as AsyncGenerator<{
        res: T;
        err?: boolean;
        reason?: any;
      }>;
    }
    hasNext = true;
    const generatorFn = async function* () {
      while (hasNext) {
        abortController = new AbortController();
        const res = {} as {
          res: T;
          err?: boolean;
          reason?: any;
        };
        try {
          res.res = await api(abortController);
        } catch (error) {
          if (abortController.signal.aborted) {
            hasNext = false;
            return;
          }
          res.err = true;
          res.reason = error;
        }
        yield res;
        await wait();
      }
    };
    const res = generatorFn();
    currentPoll = res;
    return res;
  };

  return { start, stop };
};
