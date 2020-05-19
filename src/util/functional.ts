export type PromiseType<P extends Promise<any>> = P extends Promise<infer A>
  ? A
  : never;

export function mapObject<T, K>(
  obj: T,
  callback: (propertyValue: T[keyof T], propertyName: keyof T) => K
) {
  const result: Partial<{ [key in keyof T]: K }> = {};
  Object.entries(obj).forEach(([propertyName, propertyValue]) => {
    result[propertyName as keyof T] = callback(
      propertyValue,
      propertyName as keyof T
    );
  });

  return result as { [key in keyof T]: K };
}
