export function promiseHandler<T, U>(cb: (data: T) => U) {
  const cbs: any = [];
  const datas: U[] = [];
  const promises: Promise<U>[] = [];
  return {
    fn: jest.fn((data: T) => {
      datas.push(cb(data));
      promises.push(new Promise<U>((resolve) => cbs.push(resolve)));
      return promises[promises.length - 1];
    }),
    resolve: () =>
      Promise.all(
        promises.map((promise, index) => {
          cbs[index](datas[index]);
          return promise;
        })
      ),
  };
}

export async function tick(count: number) {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => resolve());
  }
}

export function registerRequestIdleCallback() {
  let cbs: FrameRequestCallback[] = [];

  jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb) => cbs.push(cb));

  return () => {
    const oldCbs = cbs;
    cbs = [];
    oldCbs.forEach((cb) => cb(1));
  };
}
