export function fromEntries<T, U>(entries: T[], cb: (value: T) => [string, U]) {
  const result: { [k: string]: U } = {};

  entries.forEach((entry) => {
    const [key, value] = cb(entry);
    result[key] = value;
  });

  return result;
}
