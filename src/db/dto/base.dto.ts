export interface Base {
  id: string;
}

export class BaseDto implements Base {
  id: string;
}

export type SelectResult<T, K extends string = string> = string extends K
  ? T
  : Pick<T, K & keyof T>;

export type WithPopulated<
  T,
  TRefs extends Record<string, unknown>,
  P extends string = never,
> = string extends P
  ? T
  : [P] extends [never]
    ? T
    : Omit<T, P> & {
        [K in P]: K extends keyof TRefs ? TRefs[K] : unknown;
      };
