export type KeyValueMap<T = any> = { [key: string]: T };

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {constructor};
}
