export type StripUndefined<T> = {
  [K in keyof T as [T[K]] extends [undefined] ? never : K]: Exclude<
    T[K],
    undefined
  >;
};

type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

export type DefinedProperties<T> = {
  [K in Exclude<keyof T, OptionalKeys<T>>]: T[K];
} & {
  [K in OptionalKeys<T>]?: Exclude<T[K], undefined>;
};

/**
 * Removes properties with `undefined` values from an object.
 * Essential for Prisma update queries where undefined properties should be omitted
 * rather than passed, conforming with strict `exactOptionalPropertyTypes`.
 */
export function removeUndefined<T extends object>(
  obj: T,
): DefinedProperties<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as DefinedProperties<T>;
}

export const stripUndefined = removeUndefined;
