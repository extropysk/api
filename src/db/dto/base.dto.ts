export interface Base {
  id: string;
}

export class BaseDto implements Base {
  id: string;
}

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type SelectResult<T, K extends string = string> = string extends K
  ? T
  : Pick<T, K & keyof T>;

// Extract the first segment of a dot-separated string
type Head<S extends string> = S extends `${infer H}.${string}` ? H : S;

// Get sub-paths for a specific top-level key K from a union of dot paths
type SubPaths<
  P extends string,
  K extends string,
> = P extends `${K}.${infer Rest}` ? Rest : never;

// Get unique top-level keys from a union of dot paths
export type PopulateKeys<P extends string> = Head<P>;

// Strip prefix "K." from keys in TRefs to get nested refs
type PrefixedRefs<TRefs extends Record<string, unknown>, K extends string> = {
  [Key in keyof TRefs as Key extends `${K}.${infer Rest}`
    ? Rest
    : never]: TRefs[Key];
};

export type WithPopulated<
  T,
  TRefs extends Record<string, unknown>,
  P extends string = never,
> = string extends P
  ? T
  : [P] extends [never]
    ? T
    : Omit<T, PopulateKeys<P>> & {
        [K in PopulateKeys<P>]: K extends keyof TRefs
          ? WithPopulated<TRefs[K], PrefixedRefs<TRefs, K>, SubPaths<P, K>>
          : unknown;
      };
